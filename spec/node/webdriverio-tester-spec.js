/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

'use strict';

const _ = require('lodash');
const Q = require('q');
const sleep = require('sleep');

const t = require('../../src/transplant')(__dirname);
const utils = t.require('./cli/utils');
const tester = t.require('./webdriverio-tester')();

/**
 * Helper for creating a promise (so I don't need to disable new-cap everywhere)
 * @param {*} resolution - what to resolve the promise with
 * @returns {Promise} the promise
 */
function makePromise(resolution) {
    return Q(resolution); // eslint-disable-line new-cap
}

/**
 * Verify the given commands were executed in-order
 * @param {Object} ctx - the context for the shared specs
 * @param {String[]} ctx.commands - the expected commands
 */
function verifyCommands(ctx) {
    describe('(shared) commands verification', () => {
        let commands;
        beforeEach(() => {
            commands = ctx.commands;
        });

        it('calls the right number of commands', () => {
            expect(tester.exec.calls.count()).toBe(commands.length);
        });

        it('calls the correct commands in order', () => {
            _.forEach(commands, (command, index) => {
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
    let argv, timestamp, server, initialSleep, pollInterval, extras, isApp;
    describe('(shared) .command() specs', () => {
        beforeEach((done) => {
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
            setTimeout(() => {
                done();
            }, 1);
        });

        it('creates a tarball', () => {
            expect(tester.createTarball).toHaveBeenCalledWith(isApp, extras);
        });

        it('submits the tarball', () => {
            expect(tester.submitTarball).toHaveBeenCalledWith(server);
        });

        it('removes the tarball', () => {
            expect(tester.remove).toHaveBeenCalledWith('test.tar.gz');
        });

        it('waits for results', () => {
            expect(tester.waitForResults).toHaveBeenCalledWith({
                timestamp: timestamp,
                server: server,
                pollInterval: pollInterval,
                initialSleep: initialSleep,
            });
        });

        it('processes the results', () => {
            expect(tester.processResults).toHaveBeenCalledWith(timestamp, server);
        });
    });
}

describe('webdriverio-tester', () => {
    let results;
    const ctx = {};

    beforeEach(() => {
        results = {};

        spyOn(utils, 'throwCliError');
        spyOn(console, 'log');
        spyOn(tester, 'exec').and.callFake((command) => {
            let result = results[command];
            return makePromise(_.isArray(result) ? result.shift() : result);
        });
    });

    describe('.prepareDemoDirectory()', () => {
        let newExtras;

        beforeEach(done => {
            spyOn(tester, 'makeDemoDirectory').and.returnValue(makePromise('make-dir'));
            spyOn(tester, 'copyFilesToDemoDirectory').and.returnValue(makePromise('copy-files'));
            tester.prepareDemoDirectory('extras').then(resp => {
                newExtras = resp;
                done();
            });
        });

        it('calls makeDemoDirectory()', () => {
            expect(tester.makeDemoDirectory).toHaveBeenCalled();
        });

        it('calls copyFilesToDemoDirectory()', () => {
            expect(tester.copyFilesToDemoDirectory).toHaveBeenCalledWith('extras');
        });

        it('resolves with the resolution of copyFilesToDemoDirectory()', () => {
            expect(newExtras).toBe('copy-files');
        });
    });

    describe('.createTarball()', () => {
        beforeEach(() => {
            spyOn(tester, 'prepareDemoDirectory').and.returnValue(makePromise(['dd/foo', 'dd/bar']));
        });

        describe('for app', () => {
            beforeEach((done) => {
                ctx.commands = [
                    'tar --exclude="*.map" -czf test.tar.gz spec demo/index.html demo/bundle dd/foo dd/bar',
                    'rm -rf demo',
                ];

                tester.createTarball(true, ['foo', 'bar']).then(() => {
                    done();
                });
            });

            it('prepares a demo directory', () => {
                expect(tester.prepareDemoDirectory).toHaveBeenCalledWith(['foo', 'bar']);
            });

            verifyCommands(ctx);
        });

        describe('for component', () => {
            beforeEach((done) => {
                ctx.commands = [
                    'tar --exclude="*.map" -czf test.tar.gz spec demo/index.html demo/bundle foo bar',
                ];

                tester.createTarball(false, ['foo', 'bar']).then(() => {
                    done();
                });
            });

            it('does not prepare a demo directory', () => {
                expect(tester.prepareDemoDirectory).not.toHaveBeenCalled();
            });

            verifyCommands(ctx);
        });
    });

    describe('.submitTarball()', () => {
        let result;
        beforeEach((done) => {
            const command = 'curl -s -F "tarball=@test.tar.gz" -F "entry-point=demo/" https://server.com/';

            // because of how the exec() mocking is done, if you want to return an array, you need to wrap it
            // in another array (ewww). TODO: fix that
            results[command] = [
                ['command-results', ''],
            ];
            ctx.commands = [
                command,
            ];

            tester.submitTarball('https://server.com').then((resolution) => {
                result = resolution;
                done();
            });
        });

        it('returns the result of the command', () => {
            expect(result).toBe('command-results');
        });

        verifyCommands(ctx);
    });

    describe('.waitForResults()', () => {
        beforeEach((done) => {
            const command = 'curl -s server/status/timestamp';
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
            }).then(() => {
                done();
            });
        });

        it('performs initial sleep first', () => {
            expect(sleep.sleep.calls.argsFor(0)).toEqual([123]);
        });

        it('makes an initial polling sleep', () => {
            expect(sleep.sleep.calls.argsFor(1)).toEqual([456]);
        });

        it('makes a secondary polling sleep', () => {
            expect(sleep.sleep.calls.argsFor(2)).toEqual([456]);
        });

        it('does not make a third polling sleep', () => {
            expect(sleep.sleep.calls.count()).toEqual(3);
        });

        verifyCommands(ctx);
    });

    describe('.remove()', () => {
        beforeEach((done) => {
            ctx.commands = [
                'rm -rf my-file',
            ];

            tester.remove('my-file').then(done);
        });

        verifyCommands(ctx);
    });

    describe('.processResults()', () => {
        beforeEach((done) => {
            spyOn(tester, 'remove').and.returnValue(makePromise());

            const getJsonCommand = 'curl -s my-server/screenshots/output-my-timestamp.json';
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

        it('removes the tarball', () => {
            expect(tester.remove).toHaveBeenCalledWith('bundle.tar.gz');
        });

        it('logs the json info to console', () => {
            expect(console.log).toHaveBeenCalledWith('output from the test run');
        });

        verifyCommands(ctx);
    });

    describe('.command()', () => {
        const context = {};
        describe('with defaults', () => {
            beforeEach(() => {
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

        describe('with custom options', () => {
            beforeEach(() => {
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
