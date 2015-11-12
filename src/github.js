/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

'use strict';

const _ = require('lodash');
const Q = require('q');
const exec = require('child_process').exec;

const http = require('q-io/http');
const fs = require('q-io/fs');
const versiony = require('versiony');

const utils = require('./cli/utils');
const config = require('./config');

/** @exports github */
const ns = {

    /**
     * Initialize the module
     * @returns {github} the instance
     */
    init() {

        // this is on the object for eaiser mocking
        this.exec = Q.denodeify(exec);

        this.config = config.load(process.cwd());

        if (!this.config) {
            throw new Error('beaker.json missing');
        }

        this.config.urlBase = 'https://' + this.config.github.host + '/api/v3';

        return this;
    },

    /**
     * Create a new release
     * @param {Object} argv - the minimist arguments object
     * @throws CliError
     */
    createRelease(argv) {
        utils.throwCliError(argv._[1] + ' currently unavailable, hopefully coming back soon', 1);
    },

    /**
     * Make GitHub API GET request
     * @param {String} apiPath - path to desired GitHub API
     * @returns {Q.Promise} a promise that will be resolved with the result of the request
     */
    getRequest(apiPath) {
        const url = this.config.urlBase + apiPath;
        return http.request(url).then((res) => {
            // NOTE: this is all within this then() because the inner one needs
            // access to the res object and I wasn't sure how to do that if I returned
            // res.body.read() here and used chaining -- ARM
            return res.body.read().then((content) => {
                return {
                    status: res.status,
                    data: JSON.parse(content),
                };
            });
        });
    },

    /**
     * Get list of commits for repository
     * @param {String} repo - repsitory name (including owner)
     * @param {String} branch - branch name
     * @returns {Q.Promise} a promise that will be resolved with the results of the commits API
     */
    getCommits(repo, branch) {
        return this.getRequest('/repos/' + repo + '/commits?sha=' + branch);
    },

    /**
     * Get single pull request for repository
     * @param {String} repo - repsitory name (including owner)
     * @param {String} number - pull request number
     * @returns {Q.Promise} a promise that will be resolved with the results of the commits API
     */
    getPullRequest(repo, number) {
        return this.getRequest('/repos/' + repo + '/pulls/' + number);
    },

    /**
     * Get list of pull requests for repository
     * @param {String} repo - repsitory name (including owner)
     * @returns {Q.Promise} a promise that will be resolved with the results of the pulls API
     */
    getPullRequests(repo) {
        return this.getRequest('/repos/' + repo + '/pulls');
    },

    /**
     * Get pull request for repository that's head is at specific commit
     * @param {String} repo - repsitory name (including owner)
     * @param {String} sha - commit hash
     * @returns {Q.Promise} a promise that will be resolved with the pull request for the given SHA
     */
    getPullRequestForSha(repo, sha) {
        console.info('Looking for PR on repository ' + repo + ' with HEAD at commit ' + sha);
        return this.getPullRequests(repo).then((resp) => {
            var result = null;
            resp.data.forEach((pr) => {
                // If pull request is at specific commit
                if (pr.head.sha === sha || pr.merge_commit_sha === sha) {
                    console.info('Found PR at commit: ' + pr.id);
                    result = pr;
                    return false;
                }
            });

            return result;
        });
    },

    /**
     * Get version bump level from pull request information
     * @param {Object} pr - pull request information
     * @returns {String} version bump level comment (null if comment not found)
     */
    getVersionBumpLevel(pr) {
        var match = pr.body.match(/#(MAJOR|MINOR|PATCH)#/);

        if (!match || match.length < 2) {
            console.info('Version bump comment not found');
            return null;
        }

        return match[1].toLowerCase();
    },

    /**
     * obvious
     * @param {Object} pr - pull request information
     * @returns {Boolean} whether or not version bump comment is present in pull request
     */
    hasVersionBumpComment(pr) {
        return this.getVersionBumpLevel(pr) !== null;
    },

    /**
     * Determine if all required arguments are present for bump commands
     * @param {Object} argv - the minimist arguments object
     * @param {String[]} requiredArgs - list of required arguments
     * @throws CliError
     */
    verifyRequiredArgs(argv, requiredArgs) {
        var errors = [];

        requiredArgs.forEach((arg) => {
            if (!_.has(argv, arg)) {
                errors.push(arg + ' argument is required');
            }
        });

        if (errors.length > 0) {
            utils.throwCliError(errors.join('\n'), 1);
        }
    },

    /**
     * Determine if version is bumped
     * @param {Object} argv - the minimist arguments object
     */
    versionBumped(argv) {
        var self = this;
        this.verifyRequiredArgs(argv, ['repo', 'sha']);

        this.getPullRequestForSha(argv.repo, argv.sha)
            .then((pr) => {
                if (!self.hasVersionBumpComment(pr)) {
                    utils.throwCliError('Missing version bump comment', 1);
                }
            })
            .done();
    },

    /**
     * Bump version in package.json files
     * @param {String} bump - version bump level
     * @throws CliError
     */
    bumpFiles(bump) {

        // fill in the correct number of spaces based on JSON_TABS env
        var numSpaces = parseInt(process.env.JSON_TABS || '4', 10);
        var jsonIndent = new Array(numSpaces + 1).join(' ');

        // Get current version from package.json
        var v = versiony.from('package.json').indent(jsonIndent);

        switch (bump) {
            case 'major':
                v.newMajor();
                break;

            case 'minor':
                v.minor().patch(0);
                break;

            case 'patch':
                v.patch();
                break;

            default:
                utils.throwCliError('Missing version bump comment', 1);
                break;
        }

        // Update package.json with bumped version
        v.to('package.json').end();
    },

    /**
     * Get the current branch (based on last commit) only valid for merge scenario, not PRs
     * @returns {Q.Promise} a promise resolved with the the name of the branch
     */
    getBranch() {
        return this.exec('git rev-parse --abbrev-ref HEAD').then((result) => {
            return result[0].replace('\n', '');
        });
    },

    /**
     * Push local Git changes to remote
     * @param {String} branch - the branch to push to
     * @returns {Q.Promise} a promise resolved with the results of pushing the changes to origin
     */
    pushChanges(branch) {
        var cmd = 'git push origin ' + branch;
        console.info(cmd);
        return this.exec(cmd);
    },

    /**
     * Commit changes to package.json
     * @returns {Q.Promise} a promise that is resolved when the files have been committed
     */
    commitBumpedFiles() {
        var self = this;
        var promises = [];
        ['package.json'].forEach((file) => {
            var promise = fs.exists(file).then((exists) => {
                if (exists) {
                    return self.exec('git add ' + file);
                }
            });
            promise.done();
            promises.push(promise);
        });

        return Q.allSettled(promises).then(() => {
            return self.exec('git commit -m "bump version"');
        });
    },

    /**
     * Collect all the version bumps in the list of commits
     * @param {String} repo - the repository name (including owner)
     * @param {Object[]} commits - the array of commits to go through
     * @returns {Q.Promsie} a promise resolved with the array of version bumps to be made
     */
    getVersionBumps(repo, commits) {
        var self = this;

        var prPromises = [];
        _.forEach(commits, (commitObj, index) => {
            // If commit was made by the CI system we can ignore all previous commits
            if (commitObj.commit.author.email === self.config.github.email) {
                return false;
            }

            // Look for GitHub pull request merge message on commit
            var matches = commitObj.commit.message.match(/^Merge pull request #(\d+)/i);

            // If commit is for a pull request merge
            if (matches) {
                var prPromise = self.getPullRequest(repo, matches[1]).then((resp) => {
                    return {
                        index: index,
                        resp: resp,
                    };
                });
                prPromises.push(prPromise);
                prPromise.done();
            }
        });

        return Q.all(prPromises).then((resolutions) => {
            var responses = _(resolutions).sortBy('index').pluck('resp').pluck('data').value();

            // reverse it since we need to bump versions from oldest to newest
            return responses.map(self.getVersionBumpLevel).reverse();
        });
    },

    /**
     * Bump the version for the given repo/branch
     * @param {String} repo - the repository (including owner)
     * @param {String} branch - the branch to bump
     * @returns {Q.Promise} a promise resolved when bump is finished
     */
    bumpVersionForBranch(repo, branch) {
        var self = this;
        return this.getCommits(repo, branch)
            .then((resp) => {
                return self.getVersionBumps(repo, resp.data);
            })
            .then((bumps) => {
                bumps.forEach((bump) => {
                    self.bumpFiles(bump);
                });
            })
            .then(() => {
                return self.commitBumpedFiles(branch);
            })
            .then(() => {
                return self.pushChanges(branch);
            })
            .then((result) => {
                if (result.code > 0) {
                    utils.throwCliError('Failed to push changes to ' + branch + ': ' + result.stdout, 1);
                }
            });
    },

    /**
     * Bump version based on comment in pull request
     * @param {Object} argv - the minimist arguments object
     * @throws CliError
     */
    bumpVersion(argv) {
        var self = this;

        this.verifyRequiredArgs(argv, ['repo']);

        this.getBranch()
            .then((branch) => {
                if (branch === null) {
                    utils.throwCliError('Unable to lookup branch', 1);
                }
                return branch;
            })
            .then((branch) => {
                return self.bumpVersionForBranch(argv.repo, branch);
            })
            .done();
    },

    /**
     * Actual functionality of the 'github' command
     * @param {Ojbect} argv - the minimist arguments object
     * @throws CliError
    */
    command(argv) {
        if (argv._.length !== 2) {
            utils.throwCliError('Invalid command: ' + JSON.stringify(argv._), 1);
        }

        console.info(argv);

        var command = argv._[1];

        switch (command) {
            case 'bump-version':
                this.bumpVersion(argv);
                break;

            case 'version-bumped':
                this.versionBumped(argv);
                break;

            case 'release':
                this.createRelease(argv);
                break;

            default:
                utils.throwCliError('Unknown command: ' + command, 1);
                break;
        }
    },
};

function factory() {
    return Object.create(ns).init();
}

factory.proto = ns;

module.exports = factory;
