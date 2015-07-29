/**
 * Stub rewire dependencies
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

/* global beforeEach, afterEach */

/**
 * Stub dependencies of a rewired module
 * @param {Module} rewiredModule - the module loaded with rewire()
 * @param {Object} deps - key-value pairs of dependencies to stub out and what to stub them with
 */
function stubDeps(rewiredModule, deps) {
    let revert;

    beforeEach(() => {
        revert = rewiredModule.__set__(deps);
    });

    afterEach(() => {
        revert();
    });
}

module.exports = stubDeps;
