/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

var gruntHelper = require('./grunt/helper');
var testUtils = require('./test-utils');

/** @exports beaker */
var ns = {
    gruntHelper: gruntHelper, // for backward compatibility
    testUtils: testUtils, // for backward compatibility
    transplant: require('./transplant'),
    jasmine: testUtils,
    e2e: testUtils.e2e,
};

/**
 * Better named wrapper around the grunt/helper module
 * @param {Grunt} grunt - the grunt instance to initialize
 */
ns.pour = function (grunt) {
    gruntHelper.init(grunt);
};

module.exports = ns;
