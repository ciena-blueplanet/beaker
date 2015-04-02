/**
 * @file spec for indent eslint rule
 * @copyright 2014-2015 Cyan, Inc. All rights reserved
*/

'use strict';

var t = require('../../src/transplant')(__dirname);
var indent = t.require('./indent');

describe('indent', function () {
    // NOTE: We don't have a proper test for the indent rule
    // because we did not write it, but rather took it from
    // https://github.com/nodeca/nodeca/blob/master/support/eslint_plugins/indent.js
    it('exists', function () {
        expect(indent).not.toBeUndefined();
    });

    it('is a function', function () {
        expect(typeof indent).toBe('function');
    });
});
