/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

'use strict';

const gruntHelper = require('./grunt/helper');
const testUtils = require('./test-utils');

/** @exports beaker */
module.exports = {
    gruntHelper: gruntHelper, // for backward compatibility
    testUtils: testUtils, // for backward compatibility
    transplant: require('./transplant'),
    jasmine: testUtils,
    e2e: testUtils.e2e,

    /**
     * Better named wrapper around the grunt/helper module
     * @param {Grunt} grunt - the grunt instance to initialize
     */
    pour(grunt) {
        gruntHelper.init(grunt);
    },
};
