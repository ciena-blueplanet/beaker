/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const t = require('../../src/transplant')(__dirname);
const utils = t.require('./test-utils');

/**
 * Shared behavior for wait method
 * @param {Object} context - the spec context
 */
function sharedWaitBehavior(context) {
    let done, milliseconds, timeoutFn, callback;

    describe('(shared) wait specs', () => {
        beforeEach(() => {
            done = context.done;
            milliseconds = context.milliseconds;
            timeoutFn = context.timeoutFn;
            callback = context.callback;
        });

        it('calls timeoutFn()', () => {
            expect(timeoutFn).toHaveBeenCalledWith(jasmine.any(Function), milliseconds);
        });

        it('does not call done() yet', () => {
            expect(done).not.toHaveBeenCalled();
        });

        describe('(shared) when timeout is reached', () => {
            beforeEach(() => {
                // call the method passed to timeoutFn
                timeoutFn.calls.mostRecent().args[0]();
            });

            it('calls done()', () => {
                expect(done).toHaveBeenCalled();
            });

            it('calls callback() if given', () => {
                if (callback) {
                    expect(callback).toHaveBeenCalled();
                }
            });
        });
    });
}

/**
 * Shared behavior for waitForPromise method
 * @param {Object} context - the spec context
 */
function sharedWaitForPromiseBehavior(context) {
    let done, promise, callback, errback, secondPromise;

    describe('(shared) waitForPromise specs', () => {
        beforeEach(() => {
            done = context.done;
            promise = context.promise;
            secondPromise = context.secondPromise;
            callback = context.callback;
            errback = context.errback;
        });

        it('calls promise.then()', () => {
            expect(promise.then).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
        });

        it('does not call done() yet', () => {
            expect(done).not.toHaveBeenCalled();
        });

        it('calls done() on the response of the first then() call', () => {
            expect(secondPromise.done).toHaveBeenCalled();
        });

        describe('(shared) when promise is resolved', () => {
            let data;
            beforeEach(() => {
                data = 'some-data';

                // call the method passed to promise.then
                promise.then.calls.mostRecent().args[0](data);
            });

            it('calls done()', () => {
                expect(done).toHaveBeenCalled();
            });

            it('calls callback() if given', () => {
                if (callback) {
                    expect(callback).toHaveBeenCalledWith(data);
                }
            });
        });

        describe('(shared) when promise is rejected', () => {
            let err;
            beforeEach(() => {
                err = 'some-error';

                // call the method passed to promise.then
                promise.then.calls.mostRecent().args[1](err);
            });

            it('calls done()', () => {
                expect(done).toHaveBeenCalled();
            });

            it('calls errback() if given', () => {
                if (errback) {
                    expect(errback).toHaveBeenCalledWith(err);
                }
            });
        });
    });
}

describe('test-utils', () => {
    describe('.wait()', () => {
        const ctx = {};

        beforeEach(() => {
            ctx.done = jasmine.createSpy('done');
            ctx.timeoutFn = jasmine.createSpy('timeoutFn');
        });

        describe('with default args', () => {
            beforeEach(() => {
                ctx.milliseconds = 0;
                utils.wait(ctx.done, undefined, undefined, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });

        describe('with timeout given', () => {
            beforeEach(() => {
                ctx.miliseconds = 123;
                utils.wait(ctx.done, ctx.milliseconds, undefined, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });

        describe('with callback given', () => {
            beforeEach(() => {
                ctx.callback = jasmine.createSpy('callback');
                utils.wait(ctx.done, null, ctx.callback, ctx.timeoutFn);
            });

            sharedWaitBehavior(ctx);
        });
    });

    describe('.waitForPromise()', () => {
        const ctx = {};

        beforeEach(() => {
            ctx.done = jasmine.createSpy('done');
            ctx.promise = {
                then: jasmine.createSpy('promise.then'),
            };
            ctx.secondPromise = {
                done: jasmine.createSpy('secondPromise.done'),
            };
            ctx.promise.then.and.returnValue(ctx.secondPromise);
        });

        describe('without callback', () => {
            beforeEach(() => {
                utils.waitForPromise(ctx.done, ctx.promise);
            });

            sharedWaitForPromiseBehavior(ctx);
        });

        describe('with callback', () => {
            beforeEach(() => {
                ctx.callback = jasmine.createSpy('callback');
                utils.waitForPromise(ctx.done, ctx.promise, ctx.callback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });

        describe('with errback', () => {
            beforeEach(() => {
                delete ctx.callback;
                ctx.errback = jasmine.createSpy('errback');
                utils.waitForPromise(ctx.done, ctx.promise, null, ctx.errback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });

        describe('with callback and errback', () => {
            beforeEach(() => {
                ctx.callback = jasmine.createSpy('callback');
                ctx.errback = jasmine.createSpy('errback');
                utils.waitForPromise(ctx.done, ctx.promise, ctx.callback, ctx.errback);
            });

            sharedWaitForPromiseBehavior(ctx);
        });
    });
});
