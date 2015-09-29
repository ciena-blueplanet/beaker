/**
 * Loads/enables all our custom jasmine helpers
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

/* global beforeEach, jasmine */

import {toDeepEqual, toBeStubComponent, toHaveCorrectPropTypes} from './custom-matchers';

beforeEach(() => {
    jasmine.addMatchers({
        toDeepEqual,
        toBeStubComponent,
        toHaveCorrectPropTypes,
    });
});
