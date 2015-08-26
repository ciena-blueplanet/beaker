/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

/**
 * @typedef Result
 * @property {Number} code - the exit code of the command
 * @property {String} stdout - the standard output from command
 */

require('./typedefs');

var _ = require('lodash');
var Q = require('q');
var path = require('path');
var exec = require('child_process').exec;
var sleep = require('sleep');

var throwCliError = require('./cli/utils').throwCliError;

/**
 * Helper for creating a promise (so I don't need to disable new-cap everywhere)
 * @param {*} resolution - what to resolve the promise with
 * @returns {Promise} the promise
 */
function makePromise(resolution) {
    /* eslint-disable new-cap */
    return Q(resolution);
    /* eslint-enable new-cap */
}

/** @alias tester */
var ns = {
    /**
     * Initialize the module
     * @returns {tester} the tester instance
     */
    init: function () {
        // this is on the object for eaiser mocking
        this.exec = Q.denodeify(exec);
        return this;
    },

    /**
     * Obvious
     * @returns {Promise} resolved when exec finishes
     */
    makeDemoDirectory: function () {
        return this.exec('mkdir demo');
    },

    /**
     * obvious
     * @param {String} filename - the filename to remove
     * @returns {Promise} resolved with result of exec
     */
    remove: function (filename) {
        return this.exec('rm -rf ' + filename);
    },

    /**
     * if we're an app, remove the demo directory
     * @param {Boolean} isApp - true if app project
     * @param {AsyncCallback} callback - the async.waterfall callback to call when done or on error
     */
    maybeRemoveDemoDirectory: function (isApp) {
        if (isApp) {
            return this.remove('demo');
        } else {
            return makePromise();
        }
    },

    /**
     * Obvious
     * @param {String[]} extras - extra files/directories to include in tarball
     * @returns {Promise} resolves when done
     */
    copyFilesToDemoDirectory: function (extras) {
        var cmd = ['cp', '-a', 'index.html', 'bundle'];
        cmd = cmd.concat(extras);
        cmd.push('demo');

        return this.exec(cmd.join(' ')).then(function () {
            var newExtras = _.map(extras, function (extra) {
                return 'demo/' + extra;
            });

            return newExtras;
        });
    },

    /**
     * @param {String[]} extras - extra files/directories to include in tarball
     * @returns {Promise} resolved when done
     */
    prepareDemoDirectory: function (extras) {
        var self = this;
        return this.makeDemoDirectory()
            .then(function () {
                return self.copyFilesToDemoDirectory(extras);
            });
    },

    /**
     * if we're an app, prepare the demo directory
     * @param {Boolean} isApp - true if app project
     * @param {String[]} extras - optional extra files/directories to include in tarball
     * @returns {Promise} resolved when done
     */
    maybePrepareDemoDirectory: function (isApp, extras) {
        if (isApp) {
            return this.prepareDemoDirectory(extras);
        } else {
            return extras;
        }
    },

    /**
     * obvious
     * @param {String[]} extras - extra files/directories to include in tarball
     * @param {AsyncCallaback} callback - callback to call once we're done
     */
    tarUpDemoDirectory: function (extras) {

        var cmd = ['tar', '--exclude="*.map"', '-czf', 'test.tar.gz', 'spec', 'demo/index.html', 'demo/bundle'];
        cmd = cmd.concat(extras);

        return this.exec(cmd.join(' '));
    },

    /**
     * Create a tarball of the resources to submit
     * @param {Boolean} isApp - true if we need to fake the demo directory
     * @param {String[]} extras - optional extra files/directories to include in tarball
     * @returns {Promise} resolved when done
     */
    createTarball: function (isApp, extras) {
        var self = this;

        console.log('Creating bundle...');
        return this.maybePrepareDemoDirectory(isApp, extras)
            .then(function (newExtras) {
                return self.tarUpDemoDirectory(newExtras);
            })
            .then(function () {
                return self.maybeRemoveDemoDirectory(isApp);
            });
    },

    /**
     * Submit the tarball for test
     * @param {String} server - the protocol/host/port of the server
     * @returns {Promise} resolved when done
     */
    submitTarball: function (server) {

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

        return this.exec(cmd.join(' ')).then(function (stdout) {
            timestamp = stdout.toString();
            console.log('TIMESTAMP: ' + timestamp);
            return timestamp;
        });
    },

    /**
     * Wait till the server is done with our tests
     * @param {String} cmd - the command to execute to check for results
     * @param {Number} pollInterval - the poll interval in seconds
     * @returns {Promise} resolved when done
     */
    checkForResults: function (cmd, pollInterval) {
        var self = this;
        console.log('Checking for results...');
        return this.exec(cmd).then(function (stdout) {
            if (stdout.toString().toLowerCase() === 'not found') {
                sleep.sleep(pollInterval);
                return self.checkForResults(cmd, pollInterval);
            } else {
                return makePromise();
            }
        });
    },

    /**
     * Wait till the server is done with our tests
     * @param {Object} params - object for named parameters
     * @param {String} params.timestamp - the timestamp of the results we're waiting for
     * @param {String} params.server - the protocol/host/port of the server
     * @param {Number} params.initialSleep - the initial sleep time in seconds
     * @param {Number} params.pollInterval - the poll interval in seconds
     * @returns {Promise} resolved when done
     */
    waitForResults: function (params) {
        console.log('Waiting ' + params.initialSleep + 's before checking');
        sleep.sleep(params.initialSleep);

        var cmd = 'curl -s ' + params.server + '/status/' + params.timestamp;
        return this.checkForResults(cmd, params.pollInterval);
    },

    /**
     * Fetch the results from the server
     * @param {String} url - the url to fetch results from
     * @returns {Promise} resolved when done
     */
    getResults: function (url) {
        return this.exec('curl -s ' + url, function (err, stdout) {
            console.log('Parsing results...');
            return JSON.parse(stdout.toString());
        });
    },

    /**
     * obvious
     * @param {String} url - the URL to get the tarball from
     * @param {WebdriverioServerTestResults} results - details of the test results
     * @returns {Promise} resolved when done
     */
    getTarball: function (url, results) {
        return this.exec('curl -s -O' + url);
    },

    /**
     * Obvious
     * @param {WebdriverioServerTestResults} results - details of the test results
     * @returns {Promise} resolved when done
     */
    extractTarball: function (results) {

        var filename = path.basename(results.output);
        return this.exec('tar -xf' + filename).then(function () {
            return {
                filename: filename,
                results: results,
            };
        });
    },

    // ARM IS HERE
    /**
     * Parse and output the results
     * @param {String} timestamp - the timestamp of the results we're processing
     * @param {String} server - the protocol/host/port of the server
     * @returns {Promise} resolved when done
     */
    processResults: function (timestamp, server) {

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
    },

    /**
     * Actual functionality of the 'webdriverio-test' command
     * @param {MinimistArgv} argv - the minimist arguments object
     * @throws CliError
    */
    command: function (argv) {

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
    },
};


function factory() {
    return Object.create(ns).init();
}

factory.proto = ns;

module.exports = factory;
