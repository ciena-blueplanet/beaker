/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var sh = require('execSync');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var request = require('superagent');
var httpSync = require('http-sync');
var versiony = require('versiony');

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
 * @throws an Error when response indicates failure
 * @returns {Object} JSON object
 */
ns.getRequest = function (apiPath) {
    var msg;

    var host = getConfig().github.host;
    var urlPath = '/api/v3/' + apiPath;
    var protocol = 'https';

    console.info(protocol + '://' + host + urlPath);

    var req = httpSync.request({
        host: host,
        path: urlPath,
        protocol: protocol,
    });

    req.setTimeout(10000, function () {
        msg = 'Request timed out: ' + protocol + '://' + host + urlPath;
        throw new Error(msg);
    });

    var res = req.end();

    if (res.statusCode !== 200) {
        msg = 'Status Code: ' + res.statusCode + '\n' +
            'Response Body:\n' + res.body.toString();
        throw new Error(msg);
    }

    return JSON.parse(res.body.toString());
};

/**
 * Get list of commits for repository
 * @param {String} repo - repsitory name (including owner)
 * @throws an Error when response indicates failure
 * @returns {Array<Object>} commits for repository
 */
ns.getCommits = function (repo) {
    return ns.getRequest('repos/' + repo + '/commits');
};

/**
 * Get single pull request for repository
 * @param {String} repo - repsitory name (including owner)
 * @param {String} number - pull request number
 * @throws an Error when response indicates failure
 * @returns {Object} single pull request for repository
 */
ns.getPullRequest = function (repo, number) {
    return ns.getRequest('repos/' + repo + '/pulls/' + number);
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
 * @param {Array<String>} required - list of required arguments
 * @returns {Boolean} whether or not required arguments are missing
 */
ns.missingArgs = function (argv, required) {
    var argsMissing = false;

    _.forEach(required, function (arg) {
        if (!_.has(argv, arg)) {
            console.error(arg + ' argument is required');
            argsMissing = true;
        }
    });

    return argsMissing;
};

/**
 * Determine if version is bumped
 * @param {Object} argv - the minimist arguments object
 * @returns {Number} return value (1 for failure, 0 for success)
 */
ns.versionBumped = function (argv) {
    // If missing required command line arguments
    if (ns.missingArgs(argv, ['repo', 'sha'])) {
        return 1;
    }

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
 * @returns {Boolean} whether or not file bump succeeded
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
            console.error('Missing version bump comment');
            return false;
    }

    // Update package.json with bumped version
    v.to('package.json').end();

    return true;
};

/**
 * Push local Git changes to remote
 * @returns {Boolean} whether or not push succeeded
 */
ns.pushChanges = function () {
    var branch,
        result;

    result = sh.exec('git rev-parse --abbrev-ref HEAD');

    if (result.code !== 0) {
        console.error('Failed to get branch name with error: ' + result.stdout);
        return false;
    } else {
        branch = result.stdout;
    }

    var cmd = 'git push origin ' + branch;
    console.info(cmd);

    // Push local changes to remote
    result = sh.exec(cmd);

    if (result.code !== 0) {
        console.error('Failed to push to remote with error: ' + result.stdout);
        return false;
    }

    return true;
};

/**
 * Commit changes to bower.json and package.json
 * @returns {Boolean} whether or not commit succeeded
 */
ns.commitBumpedFiles = function () {
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
    return ns.pushChanges();
};

/**
 * Bump version based on comment in pull request
 * @param {Object} argv - the minimist arguments object
 * @returns {Number} return value (1 for failure, 0 for success)
 */
ns.bumpVersion = function (argv) {
    // If missing required command line arguments
    if (ns.missingArgs(argv, ['repo'])) {
        return 1;
    }

    var commits = ns.getCommits(argv.repo);
    var error = false;

    var bumps = [];

    _.forEach(commits, function (commitObj) {
        // If commit was made by buildbot we can ignore all previous commits
        if (commitObj.commit.author.email === getConfig().github.email) {
            return false;
        }

        // Look for GitHub pull request merge message on commit
        var matches = commitObj.commit.message.match(/^Merge pull request #(\d+)/i);

        // If commit is for a pull request merge
        if (matches) {
            var pr = ns.getPullRequest(argv.repo, matches[1]);

            // If pull request not found
            if (!pr) {
                console.warn('Could not find PR #' + matches[1] + ' on repository ' + argv.repo);
                // Note: Do not change error b/c a repo could have older PR's that are from before
                // the version-bump comment
                return true;
            }

            var bump = ns.getVersionBumpLevel(pr);

            // Add to beginning of array since we need to bump versions from oldest to newest
            bumps.unshift(bump);
        }
    });

    _.forEach(bumps, function (bump) {
        // If failed to bump files
        if (!ns.bumpFiles(bump)) {
            error = true;
        }
    });

    // If failed to commit changes
    if (error || !ns.commitBumpedFiles()) {
        return 1;
    }

    return 0;
};

/**
 * Actual functionality of the 'github' command
 * @param {Ojbect} argv - the minimist arguments object
 * @returns {Number} 0 on success, 1 on error
*/
ns.command = function (argv) {
    if (argv._.length !== 2) {
        console.error('Invalid command: ' + JSON.stringify(argv._));
        return 1;
    }

    console.info(argv);

    var command = argv._[1];
    var ret = 0;

    switch (command) {
        case 'bump-version':
            ret = ns.bumpVersion(argv);
            break;

        case 'version-bumped':
            ret = ns.versionBumped(argv);
            break;

        case 'release':
            ns.createRelease(argv);
            break;

        default:
            console.error('Unknown command: ' + command);
            ret = 1;
            break;
    }

    return ret;
};

module.exports = ns;
