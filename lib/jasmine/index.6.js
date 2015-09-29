/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

/**
 * @typedef Resolver
 * @param {Function} resolve - resolve the promise
 * @param {Function} reject - reject the promise
 * @param {Function} notify - notify of progress on the promise
 */

import Q from 'q';

/**
 * Create a Promise that can be resolved by the given resolver object
 * @param {Resolver} resolver - the reference of the resolver to update (methods don't have to exist)
 * @returns {Q.Promise} the promise that is created
 */
export function makePromise(resolver) {
    /* eslint-disable new-cap */
    return Q.Promise(function (resolve, reject, notify) {
        resolver.resolve = resolve;
        resolver.reject = reject;
        resolver.notify = notify;
    });
    /* eslint-enable new-cap */
}


// ------------------------------------------------------------------------------------------------
// Waiting
// ------------------------------------------------------------------------------------------------

/**
 * Use setTimeout to give up control flow for the given number of milliseconds
 * This is useful when you want to give a promise a chance to be resolved before continuing
 * @param {Function} done - the jasmine async done() method from the spec
 * @param {Number} [milliseconds=0] - the time to wait
 * @param {Function} [callback] - will be called before done() so you can expect() stuff
 * @param {Function} [timeoutFn] - optional replacement to setTimeout (for testing in nodejs)
 */
export function wait(done, milliseconds, callback, timeoutFn) {
    if (!milliseconds) {
        milliseconds = 0;
    }

    if (timeoutFn === undefined ) {
        timeoutFn = setTimeout;
    }

    timeoutFn(() => {
        if (callback) {
            callback();
        }
        done();
    }, milliseconds);
}

/**
 * Call done() once the given promise is resolved
 * @param {Function} done - the jasmine async done() method from the spec
 * @param {Q.promise} promise - wait till this is resolved before calling done()
 * @param {Function} [callback] - will be called before done() on resolution so you can expect() stuff
 * @param {Function} [errback] - will be called before done() on rejection so you can expect() stuff
 */
export function waitForPromise(done, promise, callback, errback) {
    promise.then(
        (data) => {
            if (callback) {
                callback(data);
            }
            done();
        },
        (err) => {
            if (errback) {
                errback(err);
            }
            done();
        }
    ).done();
}
