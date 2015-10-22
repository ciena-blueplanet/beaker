/**
 * Loads/enables all our custom jasmine helpers
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

/* global beforeEach, jasmine */

import * as customMatchers from './custom-matchers';

beforeEach(() => {
    jasmine.addMatchers(customMatchers);
});
