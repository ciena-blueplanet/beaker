/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

/* global expect */

var _ = require('lodash');

/** @exports testUtils */
var ns = {};

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
ns.wait = function (done, milliseconds, callback, timeoutFn) {
    if (!milliseconds) {
        milliseconds = 0;
    }

    if (timeoutFn === undefined ) {
        timeoutFn = setTimeout;
    }

    timeoutFn(function () {
        if (callback) {
            callback();
        }
        done();
    }, milliseconds);
};

/**
 * Call done() once the given promise is resolved
 * @param {Function} done - the jasmine async done() method from the spec
 * @param {Q.promise} promise - wait till this is resolved before calling done()
 * @param {Function} [callback] - will be called before done() so you can expect() stuff
 */
ns.waitForPromise = function (done, promise, callback) {
    promise.done(function (data) {
        if (callback) {
            callback(data);
        }
        done();
    });
};

// ------------------------------------------------------------------------------------------------
// E2E Tests
// ------------------------------------------------------------------------------------------------

/**
 * @typedef {Object} Screenshot
 * @property {String} name - should be dash-separated as it will be used as part of a filename
 * @property {String} elem - the jQuery selector for element to screenshot (i.e. 'body' or '.navbar')
 */

/**
 * Helper to create webdrivercss callback to DRY up e2e specs
 * @param {Screenshot[]} screenshots - the screenshots to take
 * @returns {Function} the webdrivercss callback that makes sure the screenshots match
 */
ns.cssCallback = function (screenshots) {
    return function (err, res) {
        expect(err).toBeFalsy();
        _.forEach(screenshots, function (screenshot) {
            expect(res[screenshot.name][0].isWithinMisMatchTolerance).toBeTruthy();
        });
    };
};

// ------------------------------------------------------------------------------------------------
// Super Test (DEPRECATED)
// We probably don't need these anymore, since we don't have nodejs backends anymore
// ------------------------------------------------------------------------------------------------

/** supertest utilities */
ns.supertest = {};

/**
 * @typedef {Object} SuperTest.Response
 * {@link http://visionmedia.github.io/superagent/#response-properties}
 */

/**
 * Handler for a supertest response (only on success)
 * @callback SuperTest.ResponseHandler
 * @param {SuperTest.Response} resp - the response from the supertest request
 */

/**
 * This method is called after the supertest request responds (also supports errors)
 * @callback SuperTest.ErrorHandler
 * @param {Error} err - an error that occurred during supertest request
 * @param {SuperTest.Response} resp - the response from the supertest request
 */


/**
 * Handy shortcut for pausing a jasmine spec until a supertest .end() method is called.
 * @param {Function} done - the done method from a jasmine spec
 * @param {SuperTest.OnEnd} callback - the fn to call when supertest responds
 * @returns {SuperTest.ErrorHandler} a function to pass to .end() that handles errors as well
 */
ns.supertest.onEnd = function (done, callback) {
    return function (err, resp) {
        if (err) {
            throw err;
        }

        callback(resp);
        done();
    };
}; // onEnd //

module.exports = ns;
