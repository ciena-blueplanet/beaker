/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var Q = require('q');
var exec = Q.denodify(require('child_process').exec);
var sh = require('execSync');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var request = require('superagent');
var http = require('q-io/http');
var versiony = require('versiony');

var throwCliError = require('./cli/utils').throwCliError;
var config = require('./config');

// 'Constants' to store some info so we don't calculate it more than once
var CWD = process.cwd();

var _config;

/**
 * Retrieve configuration from config file but only load file once
 * @returns {Object} configuration
 */
function getConfig() {
    if (!_config) {
        _config = config.load(CWD);

        if (!_config) {
            throw new Error('beaker.json missing');
        }
    }

    _config.urlBase = 'https://' + _config.github.host + '/api/v3';

    return _config;
}

/** @exports github */
var ns = {};

/**
 * Handle a response from superagent, log the response to
 * the console, so the user knows what happened.
 * @param {Object} res - the response from superagent
 * @throws an Error when response indicates failure
 */
ns.onResponse = function (res) {
    var msg = 'Status Code: ' + res.status + '\n' +
        'Response Body:\n' + JSON.stringify(res.body, null, 2);

    if (!res.ok) {
        throw new Error(msg);
    } else {
        console.info(msg);
    }
};

/**
 * Create a new release
 * @param {Object} argv - the minimist arguments object
 */
ns.createRelease = function (argv) {
    _.defaults(argv, {
        branch: 'master',
        description: '',
    });

    var url = getConfig().urlBase + '/repos/' + argv.repo + '/releases';
    var body = {
        'tag_name': argv.version,
        'target_commitish': argv.branch,
        name: argv.version,
        body: argv.description,
        draft: false,
        prerelease: false,
    };

    request
        .post(url)
        .auth(getConfig().github.token, 'x-oauth-basic')
        .send(body)
        .end(ns.onResponse);
};

/**
 * Make GitHub API GET request
 * @param {String} apiPath - path to desired GitHub API
 * @returns {Q.Promise} a promise that will be resolved with the result of the request
 */
ns.getRequest = function (apiPath) {
    var url = 'https://' + getConfig().github.host + '/api/v3/' + apiPath;
    return http.request(url).then(function (res) {
        // NOTE: this is all within this then() because the inner one needs
        // access to the res object and I wasn't sure how to do that if I returned
        // res.body.read() here and used chaining -- ARM
        return res.body.read().then(function (content) {
            return {
                status: res.status,
                data: JSON.parse(content),
            };
        });
    });
};

/**
 * Get list of commits for repository
 * @param {String} repo - repsitory name (including owner)
 * @param {String} branch - branch name
 * @returns {Q.Promise} a promise that will be resolved with the results of the commits API
 */
ns.getCommits = function (repo, branch) {
    return this.getRequest('repos/' + repo + '/commits?sha=' + branch);
};

/**
 * Get single pull request for repository
 * @param {String} repo - repsitory name (including owner)
 * @param {String} number - pull request number
 * @returns {Q.Promise} a promise that will be resolved with the results of the commits API
 */
ns.getPullRequest = function (repo, number) {
    return this.getRequest('repos/' + repo + '/pulls/' + number);
};

/**
 * Get list of pull requests for repository
 * @param {String} repo - repsitory name (including owner)
 * @param {Boolean} searchAll - whether or not to search open and closed pull requests or just open
 * @throws an Error when response indicates failure
 * @returns {Array<Object>} open pull requests for repository
 */
ns.getPullRequests = function (repo, searchAll) {
    var apiPath = 'repos/' + repo + '/pulls';

    if (searchAll) {
        apiPath += '?state=all';
    }

    return ns.getRequest(apiPath);
};

/**
 * Get pull request for repository that's head is at specific commit
 * @param {String} repo - repsitory name (including owner)
 * @param {String} sha - commit hash
 * @param {Boolean} searchAll - whether or not to search open and closed pull requests or just open
 * @returns {Object} pull request information (null if PR not found for SHA)
 */
ns.getPullRequestForSHA = function (repo, sha, searchAll) {
    console.info('Looking for PR on repository ' + repo + ' with HEAD at commit ' + sha);

    var result = null;
    var pullRequests = ns.getPullRequests(repo, searchAll);

    // Iterate over all open pull requests
    _.forEach(pullRequests, function (pr) {
        // If pull request is at specific commit
        if (pr.head.sha === sha || pr.merge_commit_sha === sha) {
            console.info('Found PR at commit: ' + pr.id);
            result = pr;
            return false;
        }
    });

    return result;
};

/**
 * Get version bump level from pull request information
 * @param {Object} pr - pull request information
 * @returns {String} version bump level comment (null if comment not found)
 */
ns.getVersionBumpLevel = function (pr) {
    var match = pr.body.match(/#(MAJOR|MINOR|PATCH)#/);

    if (!match || match.length < 2) {
        console.info('Version bump comment not found');
        return null;
    }

    return match[1].toLowerCase();
};

/**
 * Whether or not version bump level was specified in pull request
 * @param {Object} pr - pull request information
 * @returns {Boolean} whether or not version bump comment is present in pull request
 */
ns.specifiesVersionBumpLevel = function (pr) {
    return ns.getVersionBumpLevel(pr) !== null;
};

/**
 * Determine if all required arguments are present for bump commands
 * @param {Object} argv - the minimist arguments object
 * @param {String[]} requiredArgs - list of required arguments
 * @throws CliError
 */
ns.verifyRequiredArgs = function (argv, requiredArgs) {
    var errors = [];

    requiredArgs.forEach(function (arg) {
        if (!_.has(argv, arg)) {
            errors.push(arg + ' argument is required');
        }
    });

    if (errors.length > 0) {
        throwCliError(errors.join('\n'), 1);
    }
};

/**
 * Determine if version is bumped
 * @param {Object} argv - the minimist arguments object
 * @returns {Number} return value (1 for failure, 0 for success)
 */
ns.versionBumped = function (argv) {
    this.verifyRequiredArgs(argv, ['repo', 'sha']);

    var pr = ns.getPullRequestForSHA(argv.repo, argv.sha, false);

    // If pull request not found
    if (!pr) {
        console.error('Could not find PR on repository ' + argv.repo + ' with commit ' + argv.sha);
        return 1;
    }

    return ns.specifiesVersionBumpLevel(pr) ? 0 : 1;
};

/**
 * Bump version in bower.json and package.json files
 * @param {String} bump - version bump level
 * @throws CliError
 */
ns.bumpFiles = function (bump) {

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
            throwCliError('Missing version bump comment', 1);
            break;
    }

    // Update package.json with bumped version
    v.to('package.json').end();
};

/**
 * Get the current branch (based on last commit) only valid for merge scenario, not PRs
 * @returns {Q.Promise} a promise resolved with the the name of the branch
 */
ns.getBranch = function () {
    return exec('git rev-parse --abbrev-ref HEAD').then(function (result) {
        if (result.code !== 0) {
            throwCliError('Faild to get branch name with error: ' + result.stdout, 1);
        } else {
            return result.stdout;
        }
    });
};

/**
 * Push local Git changes to remote
 * @param {String} branch - the branch to push to
 * @returns {Boolean} whether or not push succeeded
 */
ns.pushChanges = function (branch) {
    var cmd = 'git push origin ' + branch;
    console.info(cmd);

    // Push local changes to remote
    var result = sh.exec(cmd);

    if (result.code !== 0) {
        console.error('Failed to push to remote with error: ' + result.stdout);
        return false;
    }

    return true;
};

/**
 * Commit changes to bower.json and package.json
 * @param {String} branch - the branch to push to
 * @returns {Boolean} whether or not commit succeeded
 */
ns.commitBumpedFiles = function (branch) {
    _.forEach(['bower.json', 'package.json'], function (file) {
        var filePath = path.join(CWD, file);

        // If file exists make sure to add it to git
        if (fs.existsSync(filePath)) {
            sh.run('git add ' + file);
        }
    });

    var result = sh.exec('git commit -m "bump version"');

    if (result.code !== 0) {
        console.error('git commit failed with error: ' + result.stdout);
        return false;
    }

    // Return whether or not local changes were successfully pushed to remote
    return ns.pushChanges(branch);
};

/**
 * Collect all the version bumps in the list of commits
 * @param {String} repo - the repository name (including owner)
 * @param {Object[]} commits - the array of commits to go through
 * @returns {Q.Promsie} a promise resolved with the array of version bumps to be made
 */
ns.getVersionBumps = function (repo, commits) {
    var prPromises = [];
    commits.forEach(function (commitObj, index) {
        // If commit was made by buildbot we can ignore all previous commits
        if (commitObj.commit.author.email === getConfig().github.email) {
            return false;
        }

        // Look for GitHub pull request merge message on commit
        var matches = commitObj.commit.message.match(/^Merge pull request #(\d+)/i);

        // If commit is for a pull request merge
        if (matches) {
            var prPromise = this.getPullRequest(repo, matches[1]).then(function (resp) {
                return {
                    index: index,
                    resp: resp,
                };
            });
            prPromises.push(prPromise);
            prPromise.done();
        }
    });

    return Q.all(prPromises).then(function (resolutions) {
        var responses = _(resolutions).sortBy('index').pluck('resp').value();

        // reverse it since we need to bump versions from oldest to newest
        return responses.map(this.getVersionBumpLevel).reverse();
    });
};

/**
 * Bump the version for the given repo/branch
 * @param {String} repo - the repository (including owner)
 * @param {String} branch - the branch to bump
 * @returns {Q.Promise} a promise resolved when bump is finished
 */
ns.bumpVersionForBranch = function (repo, branch) {

    return this.getCommits(repo, branch)
        .then(function (resp) {
            return this.getVersionBumps(repo, resp.data);
        })
        .then(function (bumps) {
            bumps.forEach(function (bump) {
                this.bumpFiles(bump);
            });
        })
        .then(function () {
            return this.commitBumpedFiles(branch);
        });
};

/**
 * Bump version based on comment in pull request
 * @param {Object} argv - the minimist arguments object
 * @throws CliError
 */
ns.bumpVersion = function (argv) {
    this.verifyRequiredArgs(argv, ['repo']);

    this.getBranch()
        .then(function (branch) {
            if (branch === null) {
                throwCliError('Unable to lookup branch', 1);
            }
            return branch;
        })
        .then(function (branch) {
            return this.bumpVersionForBranch(argv.repo, branch);
        })
        .done();
};

/**
 * Actual functionality of the 'github' command
 * @param {Ojbect} argv - the minimist arguments object
 * @throws CliError
*/
ns.command = function (argv) {
    if (argv._.length !== 2) {
        throwCliError('Invalid command: ' + JSON.stringify(argv._), 1);
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
            throwCliError('Unknown command: ' + command, 1);
            break;
    }
};

module.exports = ns;
