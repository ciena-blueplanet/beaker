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

var _ = require('lodash');
var path = require('path');
var sh = require('execSync');
var sleep = require('sleep');

var ns = {};


/**
 * @param {String[]} extras - extra files/directories to include in tarball
 * @returns {String[]} - updated extras (all with demo/ in front of them)
 */
ns.prepareDemoDirectory = function (extras) {

    sh.exec('mkdir demo');

    var command = ['cp', '-a', 'index.html', 'bundle'];
    command = command.concat(extras);
    command.push('demo');

    sh.exec(command.join(' '));

    var newExtras = _.map(extras, function (extra) {
        return 'demo/' + extra;
    });

    return newExtras;
};

/**
 * Create a tarball of the resources to submit
 * @param {Boolean} isApp - true if we need to fake the demo directory
 * @param {String[]} extras - optional extra files/directories to include in tarball
 * @returns {String} - the full path  of the created tarball
 */
ns.createTarball = function (isApp, extras) {

    console.log('Creating bundle...');

    if (isApp) {
        extras = this.prepareDemoDirectory(extras);
    }

    var filename = 'test.tar.gz'; // TODO: add some timestamp or anything?

    var command = ['tar', '--exclude="*.map"', '-czf', filename, 'spec', 'demo/index.html', 'demo/bundle'];
    command = command.concat(extras);

    sh.exec(command.join(' '));

    if (isApp) {
        sh.exec('rm -rf demo');
    }

    return filename;
};

/**
 * Submit the tarball for test
 * @param {String} filename - the path to the tarball to submit
 * @param {String} server - the protocol/host/port of the server
 * @returns {Result} the result of the submission
 */
ns.submitTarball = function (filename, server) {

    console.log('Submitting bundle to ' + server + ' for test...');

    var command = [
        'curl',
        '-s',
        '-F',
        '"tarball=@' + filename + '"',
        '-F',
        '"entry-point=demo/"',
        server + '/',
    ];

    return sh.exec(command.join(' '));
};

/**
 * Wait till the server is done with our tests
 * @param {Object} params - object for named parameters
 * @param {String} params.timestamp - the timestamp of the results we're waiting for
 * @param {String} params.server - the protocol/host/port of the server
 * @param {Number} params.initialSleep - the initial sleep time in seconds
 * @param {Number} params.pollInterval - the poll interval in seconds
 */
ns.waitForResults = function (params) {
    console.log('Waiting ' + params.initialSleep + 's before checking');
    sleep.sleep(params.initialSleep);

    console.log('Checking for results...');
    var command = 'curl -s ' + params.server + '/status/' + params.timestamp;
    while (sh.exec(command).stdout.toLowerCase() === 'not found') {
        sleep.sleep(params.pollInterval);
        console.log('Checking for results...');
    }
};

/**
 * Remove the given file
 * @param {String} filename - the filename to remove
 * @returns {Result} the result of the remove
 */
ns.remove = function (filename) {
    return sh.exec('rm -f ' + filename);
};

/**
 * Parse and output the results
 * @param {String} timestamp - the timestamp of the results we're processing
 * @param {String} server - the protocol/host/port of the server
 * @returns {Number} 0 on success, non-zero on error
 */
ns.processResults = function (timestamp, server) {
    var result = sh.exec('curl -s ' + server + '/screenshots/output-' + timestamp + '.json');

    console.log('Parsing results...');
    var results = JSON.parse(result.stdout);

    var filename = results.output;
    sh.exec('curl -s -O ' + server + '/' + filename);

    sh.exec('tar -xf ' + path.basename(filename));
    this.remove(path.basename(filename));

    console.log(results.info);

    console.log('----------------------------------------------------------------------');
    console.log('Screenshots directory updated with results from server.');

    if (results.exitCode === 0) {
        console.log('Tests Pass.');
    } else {
        console.log('ERRORS Encountered.');
    }

    return results.exitCode;
};

/**
 * Actual functionality of the 'webdriverio-test' command
 * @param {Ojbect} argv - the minimist arguments object
 * @returns {Number} 0 on success, 1 on error
*/
ns.command = function (argv) {

    _.defaults(argv, {
        initialSleep: 10,
        pollInterval: 3,
        server: 'http://localhost:3000',
    });

    var extras = argv._.slice(1);

    var filename = this.createTarball(argv.app, extras);
    var result = this.submitTarball(filename, argv.server);

    if (result.code !== 0) {
        console.log('The e2e test server appears to be offline');
        return result.code;
    }

    var timestamp = result.stdout;
    console.log('TIMESTAMP: ' + timestamp);

    this.remove(filename);
    this.waitForResults({
        timestamp: timestamp,
        server: argv.server,
        pollInterval: argv.pollInterval,
        initialSleep: argv.initialSleep,
    });

    return this.processResults(timestamp, argv.server);
};

module.exports = ns;
