/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

'use strict';

var t = require('../src/transplant')(__dirname);
var utils = t.require('./test-utils');

/**
 * Shared behavior for wait method
 * @param {Object} context - the spec context
 */
var sharedWaitBehavior = function (context) {
    var done, milliseconds, timeoutFn, callback;

    describe('(shared) wait specs', function () {
        beforeEach(function () {
            done = context.done;
            milliseconds = context.milliseconds;
            timeoutFn = context.timeoutFn;
            callback = context.callback;
        });

        it('calls timeoutFn()', function () {
            expect(timeoutFn).toHaveBeenCalledWith(jasmine.any(Function), milliseconds);
        });

        it('does not call done() yet', function () {
            expect(done).not.toHaveBeenCalled();
        });

        describe('(shared) when timeout is reached', function () {
            beforeEach(function () {
                // call the method passed to timeoutFn
                timeoutFn.calls.mostRecent().args[0]();
            });

            it('calls done()', function () {
                expect(done).toHaveBeenCalled();
            });

            it('calls callback() if given', function () {
                if (callback) {
                    expect(callback).toHaveBeenCalled();
                }
            });
        });
    });
};

/**
 * Shared behavior for waitForPromise method
 * @param {Object} context - the spec context
 */
var sharedWaitForPromiseBehavior = function (context) {
    var done, promise, callback;

    describe('(shared) waitForPromise specs', function () {
        beforeEach(function () {
            done = context.done;
            promise = context.promise;
            callback = context.callback;
        });

        it('calls promise.done()', function () {
            expect(promise.done).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it('does not call done() yet', function () {
            expect(done).not.toHaveBeenCalled();
        });

        describe('(shared) when promise is resolved', function () {
            var data;
            beforeEach(function () {
                data = 'some-data';

                // call the method passed to promise.done
                promise.done.calls.mostRecent().args[0](data);
            });

            it('calls done()', function () {
                expect(done).toHaveBeenCalled();
            });

            it('calls callback() if given', function () {
                if (callback) {
                    expect(callback).toHaveBeenCalledWith(data);
                }
            });
        });
    });
};

describe('test-utils', function () {
    describe('.wait()', function () {
        var ctx = {};

        beforeEach(function () {
            ctx.done = jasmine.createSpy('done');
            ctx.timeoutFn = jasmine.createSpy('timeoutFn');
        });

        describe('with default args', function () {
            beforeEach(function () {
                ctx.milliseconds = 0;
                utils.wait(ctx.done, undefined, undefined, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });

        describe('with timeout given', function () {
            beforeEach(function () {
                ctx.miliseconds = 123;
                utils.wait(ctx.done, ctx.milliseconds, undefined, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });

        describe('with callback given', function () {
            beforeEach(function () {
                ctx.callback = jasmine.createSpy('callback');
                utils.wait(ctx.done, null, ctx.callback, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });
    });

    describe('.waitForPromise()', function () {
        var ctx = {};

        beforeEach(function () {
            ctx.done = jasmine.createSpy('done');
            ctx.promise = {
                done: jasmine.createSpy('promise.done'),
            };
        });

        describe('without callback', function () {
            beforeEach(function () {
                utils.waitForPromise(ctx.done, ctx.promise);
            });

            sharedWaitForPromiseBehavior(ctx);
        });

        describe('with callback', function () {
            beforeEach(function () {
                ctx.callback = jasmine.createSpy('callback');
                utils.waitForPromise(ctx.done, ctx.promise, ctx.callback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });
    });

    describe('supertest', function () {
        describe('.onEnd()', function () {
            var done, callback, resp, respHandler;

            beforeEach(function () {
                done = jasmine.createSpy();
                callback = jasmine.createSpy();
                resp = {data: 'my data'};
                respHandler = utils.supertest.onEnd(done, callback);
            });

            it('throws the passed in error', function () {
                var err = {msg: 'my error'};
                expect(function () {
                    respHandler(err, resp);
                }).toThrow(err);
            });

            it('calls callback before done', function () {
                callback = function (response) {
                    expect(done).not.toHaveBeenCalled();
                    expect(response).toEqual(resp);
                };
                respHandler = utils.supertest.onEnd(done, callback);

                respHandler(undefined, resp);

                expect(done).toHaveBeenCalled();
            });
        });
    });
});
