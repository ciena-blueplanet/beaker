/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var path = require('path');

/**
 * @namespace
 */
var transplant = {};

/**
 * @param {String} modulePath - the full path of the module consumer
 * @param {String} [extraDirs] - extra levels under spec/ where the specs really live
 * @param {Function} [reqFunc] - override what to ue for require (for testing)
 * @returns {transplant} - the instance
 */
transplant.init = function (modulePath, extraDirs, reqFunc) {
    this.modulePath = modulePath;

    if (reqFunc === undefined) {
        reqFunc = require;
    }

    this.extraDirs = extraDirs;
    this.reqFunc = reqFunc;

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
    var parts = this.modulePath.split('spec');

    if (parts.length < 2) {
        throw new Error('Invalid modulePath "' + this.modulePath + '" no "spec" dir found!');
    }

    var pathFromSpec = parts[parts.length - 1];

    // move up to the parent of spec/
    var levels = pathFromSpec.split('/').length;
    var dots = '';

    for (var i = 0; i < levels; i++) {
        dots = path.join(dots, '..');
    }

    var pathFromSrc = pathFromSpec.replace(this.extraDirs, '');
    return this.reqFunc(path.join(this.modulePath, dots, 'src', pathFromSrc, dstPath));
};

/**
 * Create a {@link transplant} instance with the given srcPath
 *
 * @param {String} modulePath - the full path of the module consumer
 * @param {Function} [reqFunc] - override what to ue for require (for testing)
 *
 * @returns {transplant} the instance
 */
module.exports = function (modulePath, reqFunc) {
    var extraDirs = '';

    if (process.env.NODE_SPECS && process.env.NODE_SPECS !== 'spec') {
        extraDirs = process.env.NODE_SPECS.replace('spec/', '');
    }

    return Object.create(transplant).init(modulePath, extraDirs, reqFunc);
};
