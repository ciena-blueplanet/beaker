/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

var _ = require('lodash');
var Q = require('q');
var sleep = require('sleep');

var t = require('../../src/transplant')(__dirname);
var utils = t.require('./cli/utils');
var tester = t.require('./webdriverio-tester')();

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

/**
 * Verify the given commands were executed in-order
 * @param {Object} ctx - the context for the shared specs
 * @param {String[]} ctx.commands - the expected commands
 */
function verifyCommands(ctx) {
    describe('(shared) commands verification', function () {
        var commands;
        beforeEach(function () {
            commands = ctx.commands;
        });

        it('calls the right number of commands', function () {
            expect(tester.exec.calls.count()).toBe(commands.length);
        });

        it('calls the correct commands in order', function () {
            _.forEach(commands, function (command, index) {
                expect(tester.exec.calls.argsFor(index)[0]).toBe(command);
            });
        });
    });
}

/**
 * Shared specs for the .command() method, verifies all the right methods are
 * called with all the right parameters
 * @param {Object} ctx - context for the shared specs
 * @param {Object} ctx.tester - the tester
 * @param {Object} ctx.argv - minimist parsed command-line arguments
 * @param {String} ctx.server - expected server
 * @param {Number} ctx.initialSleep - expected initial sleep
 * @param {Number} ctx.pollInterval - expected poll interval
 * @param {String[]} ctx.extras - expected extra files/folders
 */
function itCallsTheRightMethods(ctx) {
    var argv, timestamp, server, initialSleep, pollInterval, extras, isApp;
    describe('(shared) .command() specs', function () {
        beforeEach(function (done) {
            argv = ctx.argv;
            timestamp = 'my-timestamp';
            server = ctx.server;
            initialSleep = ctx.initialSleep;
            pollInterval = ctx.pollInterval;
            extras = ctx.extras;
            isApp = ctx.isApp;

            spyOn(tester, 'createTarball').and.returnValue(makePromise());
            spyOn(tester, 'submitTarball').and.returnValue(makePromise(timestamp));
            spyOn(tester, 'remove').and.returnValue(makePromise());
            spyOn(tester, 'waitForResults').and.returnValue(makePromise());
            spyOn(tester, 'processResults').and.returnValue(makePromise());

            tester.command(argv);
            setTimeout(function () {
                done();
            }, 1);
        });

        it('creates a tarball', function () {
            expect(tester.createTarball).toHaveBeenCalledWith(isApp, extras);
        });

        it('submits the tarball', function () {
            expect(tester.submitTarball).toHaveBeenCalledWith(server);
        });

        it('removes the tarball', function () {
            expect(tester.remove).toHaveBeenCalledWith('test.tar.gz');
        });

        it('waits for results', function () {
            expect(tester.waitForResults).toHaveBeenCalledWith({
                timestamp: timestamp,
                server: server,
                pollInterval: pollInterval,
                initialSleep: initialSleep,
            });
        });

        it('processes the results', function () {
            expect(tester.processResults).toHaveBeenCalledWith(timestamp, server);
        });
    });
}

describe('webdriverio-tester', function () {
    var results;
    var ctx = {};

    beforeEach(function () {
        results = {};

        spyOn(utils, 'throwCliError');
        spyOn(console, 'log');
        spyOn(tester, 'exec').and.callFake(function (command) {
            var result = results[command];
            return makePromise(_.isArray(result) ? result.shift() : result);
        });
    });

    describe('.prepareDemoDirectory()', function () {
        var newExtras;

        describe('when no extras are provided', function () {
            beforeEach(function (done) {
                ctx.commands = [
                    'mkdir demo',
                    'cp -a index.html bundle demo',
                ];

                tester.prepareDemoDirectory([]).then(function (resolution) {
                    newExtras = resolution;
                    done();
                });
            });

            verifyCommands(ctx);

            it('returns empty set of extras', function () {
                expect(newExtras).toEqual([]);
            });
        });

        describe('when extras are provided', function () {
            beforeEach(function (done) {
                ctx.commands = [
                    'mkdir demo',
                    'cp -a index.html bundle foo bar baz demo',
                ];

                tester.prepareDemoDirectory(['foo', 'bar', 'baz']).then(function (resolution) {
                    newExtras = resolution;
                    done();
                });
            });

            verifyCommands(ctx);

            it('returns modified set of extras', function () {
                expect(newExtras).toEqual([
                    'demo/foo',
                    'demo/bar',
                    'demo/baz',
                ]);
            });
        });
    });

    describe('.createTarball()', function () {
        beforeEach(function () {
            spyOn(tester, 'prepareDemoDirectory').and.returnValue(makePromise(['dd/foo', 'dd/bar']));
        });

        describe('for app', function () {
            beforeEach(function (done) {
                ctx.commands = [
                    'tar --exclude="*.map" -czf test.tar.gz spec demo/index.html demo/bundle dd/foo dd/bar',
                    'rm -rf demo',
                ];

                tester.createTarball(true, ['foo', 'bar']).then(function () {
                    done();
                });
            });

            it('prepares a demo directory', function () {
                expect(tester.prepareDemoDirectory).toHaveBeenCalledWith(['foo', 'bar']);
            });

            verifyCommands(ctx);
        });

        describe('for component', function () {
            beforeEach(function (done) {
                ctx.commands = [
                    'tar --exclude="*.map" -czf test.tar.gz spec demo/index.html demo/bundle foo bar',
                ];

                tester.createTarball(false, ['foo', 'bar']).then(function () {
                    done();
                });
            });

            it('does not prepare a demo directory', function () {
                expect(tester.prepareDemoDirectory).not.toHaveBeenCalled();
            });

            verifyCommands(ctx);
        });
    });

    describe('.submitTarball()', function () {
        var result;
        beforeEach(function (done) {
            var command = 'curl -s -F "tarball=@test.tar.gz" -F "entry-point=demo/" https://server.com/';

            // because of how the exec() mocking is done, if you want to return an array, you need to wrap it
            // in another array (ewww). TODO: fix that
            results[command] = [
                ['command-results', ''],
            ];
            ctx.commands = [
                command,
            ];

            tester.submitTarball('https://server.com').then(function (resolution) {
                result = resolution;
                done();
            });
        });

        it('returns the result of the command', function () {
            expect(result).toBe('command-results');
        });

        verifyCommands(ctx);
    });

    describe('.waitForResults()', function () {
        beforeEach(function (done) {
            var command = 'curl -s server/status/timestamp';
            results[command] = [
                ['Not Found', ''],
                ['Not found', ''],
                ['finished', ''],
            ];

            spyOn(sleep, 'sleep');

            ctx.commands = [
                command,
                command,
                command,
            ];

            tester.waitForResults({
                timestamp: 'timestamp',
                server: 'server',
                initialSleep: 123,
                pollInterval: 456,
            }).then(function () {
                done();
            });
        });

        it('performs initial sleep first', function () {
            expect(sleep.sleep.calls.argsFor(0)).toEqual([123]);
        });

        it('makes an initial polling sleep', function () {
            expect(sleep.sleep.calls.argsFor(1)).toEqual([456]);
        });

        it('makes a secondary polling sleep', function () {
            expect(sleep.sleep.calls.argsFor(2)).toEqual([456]);
        });

        it('does not make a third polling sleep', function () {
            expect(sleep.sleep.calls.count()).toEqual(3);
        });

        verifyCommands(ctx);
    });

    describe('.remove()', function () {
        beforeEach(function (done) {
            ctx.commands = [
                'rm -rf my-file',
            ];

            tester.remove('my-file').then(done);
        });

        verifyCommands(ctx);
    });

    describe('.processResults()', function () {
        beforeEach(function (done) {
            spyOn(tester, 'remove').and.returnValue(makePromise());

            var getJsonCommand = 'curl -s my-server/screenshots/output-my-timestamp.json';
            ctx.commands = [
                getJsonCommand,
                'curl -s -O my-server/some-dir/bundle.tar.gz',
                'tar -xf bundle.tar.gz',
            ];

            // because of how the exec() mocking is done, if you want to return an array, you need to wrap it
            // in another array (ewww). TODO: fix that
            results[getJsonCommand] = [
                [
                    JSON.stringify({
                        output: 'some-dir/bundle.tar.gz',
                        info: 'output from the test run',
                        exitCode: 0,
                    }),
                    '',
                ],
            ];

            tester.processResults('my-timestamp', 'my-server').then(done).done();
        });

        it('removes the tarball', function () {
            expect(tester.remove).toHaveBeenCalledWith('bundle.tar.gz');
        });

        it('logs the json info to console', function () {
            expect(console.log).toHaveBeenCalledWith('output from the test run');
        });

        verifyCommands(ctx);
    });

    describe('.command()', function () {
        var context = {};
        describe('with defaults', function () {
            beforeEach(function () {
                context.tester = tester;
                context.argv = {_: []};
                context.server = 'http://localhost:3000';
                context.initialSleep = 10;
                context.pollInterval = 3;
                context.extras = [];
                context.isApp = undefined;
            });

            itCallsTheRightMethods(context);
        });

        describe('with custom options', function () {
            beforeEach(function () {
                context.tester = tester;
                context.argv = {
                    server: 'https://secure-server.com',
                    initialSleep: 5,
                    pollInterval: 1,
                    app: true,
                    _: ['script-name', 'foo', 'bar', 'baz'],
                };
                context.server = context.argv.server;
                context.initialSleep = context.argv.initialSleep;
                context.pollInterval = context.argv.pollInterval;
                context.extras = ['foo', 'bar', 'baz'];
                context.isApp = true;
            });

            itCallsTheRightMethods(context);
        });
    });
});
