/**
 * Rewire dependencies
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

/* global beforeEach, afterEach */

import _ from 'lodash';

/**
 * Re-wire dependencies of a module
 * @param {Module} module - the module loaded with babel-plugin-rewire
 * @param {Object} deps - key-value pairs of dependencies to stub out and what to stub them with
 */
export function rewireDeps(module, deps) {
    _.forIn(deps, (value, key) => {
        module.__Rewire__(key, value);
    });
}

/**
 * Reset dependencies of a module
 * @param {Module} module - the module loaded with babel-plugin-rewire
 * @param {String[]|Object} deps - arary of dep names or the object passed to rewireDeps
 */
export function resetDeps(module, deps) {
    const depKeys = _.isArray(deps) ? deps : _.keys(deps);

    depKeys.forEach(key => {
        module.__ResetDependency__(key);
    });
}
