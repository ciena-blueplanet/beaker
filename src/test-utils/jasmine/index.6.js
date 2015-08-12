/**
 * Loads/enables all our custom jasmine helpers
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

/* global beforeEach, jasmine */

const customMatchers = require('./custom-matchers');

beforeEach(() => {
    jasmine.addMatchers(customMatchers);
});
