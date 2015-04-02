/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var path = require('path');

/**
 * @namespace
 */
var transplant = {};

/**
 * @param {String} srcPath - the full path of the module consumer
 * @returns {transplant} - the instance
 */
transplant.init = function (srcPath) {
    this.srcPath = srcPath;
    return this;
};


/**
 * Expand a relative path within the spec/ tree to the same
 * path within the parallel src/ tree.
 *
 * @example
 * //
 * // Assuming the following directory structure:
 * //
 * // src/             spec/
 * //  foo/             foo/
 * //    bar/             bar/
 * //     baz.js            baz-spec.js
 * //
 * //
 * // The following would be true inside baz-spec.js
 *
 * var t = require('beaker/src/transplant')(__dirname);
 * t.require('./baz') === require('../../../src/foo/bar/baz')
 *
 * @param {String} dstPath - The destination path relative to the spec/ tree
 *
 * @returns {object} the module located at dstPath transplanted to parallel src/ tree
 */
transplant.require = function (dstPath) {
    var parts = this.srcPath.split('spec');

    if (parts.length < 2) {
        throw new Error('Invalid srcPath [' + this.srcPath + '] no "spec" dir found!');
    }

    var pathFromSpec = parts[parts.length - 1];

    // move up to the parent of spec/
    var levels = pathFromSpec.split('/').length;
    var dots = '';

    for (var i = 0; i < levels; i++) {
        dots = path.join(dots, '..');
    }

    // now add back the pathFromSpec under src/ and of course, the dstPath
    return require(path.join(this.srcPath, dots, 'src', pathFromSpec, dstPath));
};

/**
 * Create a {@link transplant} instance with the given srcPath
 *
 * @param {String} srcPath - the full path of the module consumer
 *
 * @returns {transplant} the instance
 */
module.exports = function (srcPath) {
    return Object.create(transplant).init(srcPath);
};
