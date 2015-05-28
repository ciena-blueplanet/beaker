/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

/**
 * @typedef Result
 * @property {Number} code - the exit code of the command
 * @property {String} stdout - the standard output from command
 */

require('./typedefs');


var _ = require('lodash');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var sh = require('execSync');
var sleep = require('sleep');

var throwCliError = require('./cli/utils').throwCliError;

/**
 * Obvious
 * @param {AsyncCallback} callback - callback to call when done
 */
function makeDemoDirectory(callback) {
    exec('mkdir demo', function (err) {
        callback(err);
    });
}

/**
 * if we're an app, remove the demo directory
 * @param {Boolean} isApp - true if app project
 * @param {AsyncCallback} callback - the async.waterfall callback to call when done or on error
 */
function maybeRemoveDemoDirectory(isApp, callback) {
    if (isApp) {
        remove('demo', callback);
    } else {
        callback(null);
    }
}

/**
 * Obvious
 * @param {String[]} extras - extra files/directories to include in tarball
 * @param {AsyncCallback} callback - callback to call when done
 */
function copyFilesToDemoDirectory(extras, callback) {
    var cmd = ['cp', '-a', 'index.html', 'bundle'];
    cmd = cmd.concat(extras);
    cmd.push('demo');

    exec(cmd.join(' '), function (err) {
        var newExtras = _.map(extras, function (extra) {
            return 'demo/' + extra;
        });

        callback(err, newExtras);
    });
}

/**
 * @param {String[]} extras - extra files/directories to include in tarball
 * @param {AsyncCallback} callback - the async.waterfall callback to call when done or on error
 */
function prepareDemoDirectory(extras, callback) {

    async.waterfall([
        function (cb) {
            makeDemoDirectory(cb);
        },

        function (cb) {
            copyFilesToDemoDirectory(extras, cb);
        },
    ],
    function (err, result) {
        callback(err, result);
    });
}

/**
 * if we're an app, prepare the demo directory
 * @param {Boolean} isApp - true if app project
 * @param {String[]} extras - optional extra files/directories to include in tarball
 * @param {AsyncCallback} callback - the async.waterfall callback to call when done or on error
 */
function maybePrepareDemoDirectory(isApp, extras, callback) {
    if (isApp) {
        prepareDemoDirectory(extras, callback);
    } else {
        callback(null, extras);
    }
}

/**
 * obvious
 * @param {String[]} extras - extra files/directories to include in tarball
 * @param {AsyncCallaback} callback - callback to call once we're done
 */
function tarUpDemoDirectory(extras, callback) {

    var cmd = ['tar', '--exclude="*.map"', '-czf', 'test.tar.gz', 'spec', 'demo/index.html', 'demo/bundle'];
    cmd = cmd.concat(extras);

    exec(cmd.join(' '), function (err) {
        callback(err);
    });
}

/**
 * Create a tarball of the resources to submit
 * @param {Boolean} isApp - true if we need to fake the demo directory
 * @param {String[]} extras - optional extra files/directories to include in tarball
 * @param {AsyncCallaback} callback - callback to call once we're done
 */
function createTarball(isApp, extras, callback) {

    console.log('Creating bundle...');

    async.waterfall([

        function (cb) {
            maybePrepareDemoDirectory(isApp, extras, cb);
        },

        function (newExtras, cb) {
            tarUpDemoDirectory(newExtras, cb);
        },

        function (cb) {
            maybeRemoveDemoDirectory(isApp, cb);
        },

    ], function (err) {
        callback(err);
    });
}

/**
 * Submit the tarball for test
 * @param {String} server - the protocol/host/port of the server
 * @param {AsyncCallaback} callback - callback to call once we're done
 */
function submitTarball(server, callback) {

    console.log('Submitting bundle to ' + server + ' for test...');

    var cmd = [
        'curl',
        '-s',
        '-F',
        '"tarball=@test.tar.gz"',
        '-F',
        '"entry-point=demo/"',
        server + '/',
    ];

    exec(cmd.join(' '), function (err, stdout) {
        var timestamp = '';
        if (!err) {
            timestamp = stdout.toString();
            console.log('TIMESTAMP: ' + timestamp);
        }

        callback(err, timestamp);
    });
}

/**
 * Wait till the server is done with our tests
 * @param {String} cmd - the command to execute to check for results
 * @param {Number} pollInterval - the poll interval in seconds
 * @param {AsyncCallaback} callback - callback to call once we're done
 */
function checkForResults(cmd, pollInterval, callback) {
    console.log('Checking for results...');
    exec(cmd, function (err, stdout) {
        if (err) {
            callback(err);
        } else if (stdout.toString().toLowerCase() === 'not found') {
            sleep.sleep(pollInterval);
            checkForResults(cmd, pollInterval, callback);
        } else {
            callback(null);
        }
    });
}

/**
 * Wait till the server is done with our tests
 * @param {Object} params - object for named parameters
 * @param {String} params.timestamp - the timestamp of the results we're waiting for
 * @param {String} params.server - the protocol/host/port of the server
 * @param {Number} params.initialSleep - the initial sleep time in seconds
 * @param {Number} params.pollInterval - the poll interval in seconds
 * @param {AsyncCallaback} params.callback - callback to call once we're done
 */
function waitForResults(params) {
    console.log('Waiting ' + params.initialSleep + 's before checking');
    sleep.sleep(params.initialSleep);

    var cmd = 'curl -s ' + params.server + '/status/' + params.timestamp;
    checkForResults(cmd, params.pollInterval, params.callback);
}

/**
 * obvious
 * @param {String} filename - the filename to remove
 * @param {AsyncCallback} callback - callback to call when done
 */
function remove(filename, callback) {
    exec('rm -rf ' + filename, function (err) {
        callback(err);
    });
}

/**
 * Fetch the results from the server
 * @param {String} url - the url to fetch results from
 * @param {AsyncCallback} callback - callback to call when done
 */
function getResults(url, callback) {

    exec('curl -s ' + url, function (err, stdout) {
        if (err) {
            callback(err);
        } else {
            console.log('Parsing results...');
            var results = JSON.parse(stdout.toString());
            callback(null, results);
        }
    });
}

/**
 * obvious
 * @param {String} url - the URL to get the tarball from
 * @param {WebdriverioServerTestResults} results - details of the test results
 * @param {AsyncCallback} callback - callback to call when done
 */
function getTarball(url, results, callback) {

    exec('curl -s -O' + url, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, results);
        }

    });
}

/**
 * Obvious
 * @param {WebdriverioServerTestResults} results - details of the test results
 * @param {AsyncCallback} callback - callback to call when done
 */
function extractTarball(results, callback) {

    var filename = path.basename(results.output);
    sh.exec('tar -xf ' + filename);
    exec('tar -xf' + filename, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, filename, results);
        }
    });
}


/**
 * Parse and output the results
 * @param {String} timestamp - the timestamp of the results we're processing
 * @param {String} server - the protocol/host/port of the server
 * @param {AsyncCallback} callback - callback to call when done
 */
function processResults(timestamp, server, callback) {

    async.waterfall([
        function (cb) {
            var url = server + '/screenshots/output-' + timestamp + '.json';
            getResults(url, cb);
        },

        function (results, cb) {
            var url = server + '/' + results.output;
            getTarball(url, results, cb);
        },

        function (results, cb) {
            extractTarball(results, cb);
        },

        function (filename, results, cb) {
            // remove the tarball
            remove(filename, function (err) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, results);
                }
            });
        },

    ], function (err, results) {
        if (err) {
            callback(err);
        } else {
            console.log(results.info);

            console.log('----------------------------------------------------------------------');
            console.log('Screenshots directory updated with results from server.');

            if (results.exitCode === 0) {
                console.log('Tests Pass.');
                callback(null);
            } else {
                callback({
                    message: 'ERRORS Encountered.',
                    exitCode: results.exitCode,
                });
            }
        }
    });
}

/**
 * Actual functionality of the 'webdriverio-test' command
 * @param {MinimistArgv} argv - the minimist arguments object
 * @throws CliError
*/
function command(argv) {

    _.defaults(argv, {
        initialSleep: 10,
        pollInterval: 3,
        server: 'http://localhost:3000',
    });

    var extras = argv._.slice(1);

    async.waterfall([
        function (callback) {
            createTarball(argv.app, extras, callback);
        },

        function (callback) {
            submitTarball(argv.server, callback);
        },

        function (timestamp, callback) {
            remove('test.tar.gz', function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, timestamp);
                }
            });
        },

        function (timestamp, callback) {
            waitForResults({
                timestamp: timestamp,
                server: argv.server,
                pollInterval: argv.pollInterval,
                initialSleep: argv.initialSleep,
                callback: callback,
            });
        },

        function (timestamp, callback) {
            processResults(timestamp, argv.server, callback);
        },

    ], function (err) {
        throwCliError(err.message, err.exitCode || 1);
    });
}

module.exports = {
    command: command,
    createTarball: createTarball,
    submitTarball: submitTarball,
    waitForResults: waitForResults,
    remove: remove,
    prepareDemoDirectory: prepareDemoDirectory,
    processResults: processResults,
};
