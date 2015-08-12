/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

var t = require('../../src/transplant')(__dirname);
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
    var done, promise, callback, errback, secondPromise;

    describe('(shared) waitForPromise specs', function () {
        beforeEach(function () {
            done = context.done;
            promise = context.promise;
            secondPromise = context.secondPromise;
            callback = context.callback;
            errback = context.errback;
        });

        it('calls promise.then()', function () {
            expect(promise.then).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
        });

        it('does not call done() yet', function () {
            expect(done).not.toHaveBeenCalled();
        });

        it('calls done() on the response of the first then() call', function () {
            expect(secondPromise.done).toHaveBeenCalled();
        });

        describe('(shared) when promise is resolved', function () {
            var data;
            beforeEach(function () {
                data = 'some-data';

                // call the method passed to promise.then
                promise.then.calls.mostRecent().args[0](data);
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

        describe('(shared) when promise is rejected', function () {
            var err;
            beforeEach(function () {
                err = 'some-error';

                // call the method passed to promise.then
                promise.then.calls.mostRecent().args[1](err);
            });

            it('calls done()', function () {
                expect(done).toHaveBeenCalled();
            });

            it('calls errback() if given', function () {
                if (errback) {
                    expect(errback).toHaveBeenCalledWith(err);
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
                then: jasmine.createSpy('promise.then'),
            };
            ctx.secondPromise = {
                done: jasmine.createSpy('secondPromise.done'),
            };
            ctx.promise.then.and.returnValue(ctx.secondPromise);
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

        describe('with errback', function () {
            beforeEach(function () {
                delete ctx.callback;
                ctx.errback = jasmine.createSpy('errback');
                utils.waitForPromise(ctx.done, ctx.promise, null, ctx.errback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });

        describe('with callback and errback', function () {
            beforeEach(function () {
                ctx.callback = jasmine.createSpy('callback');
                ctx.errback = jasmine.createSpy('errback');
                utils.waitForPromise(ctx.done, ctx.promise, ctx.callback, ctx.errback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });
    });
});
