/**
 * Stub rewire dependencies
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

/* global beforeEach, afterEach */

import _ from 'lodash';

/**
 * Stub dependencies of a rewired module
 * @param {Module} rewiredModule - the module loaded with babel-plugin-rewire
 * @param {Object} deps - key-value pairs of dependencies to stub out and what to stub them with
 */
export default function stubDeps(rewiredModule, deps) {

    beforeEach(() => {
        _.forIn(deps, (value, key) => {
            rewiredModule.__Rewire__(key, value);
        });
    });

    afterEach(() => {
        _.forIn(deps, (value, key) => {
            rewiredModule.__ResetDependency__(key);
        });
    });
}
