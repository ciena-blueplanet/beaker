/**
 * @file spec for no-dupe-func eslint rule
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

var t = require('../../../src/transplant')(__dirname);
var noDupeFunc = t.require('./no-dupe-func');

describe('noDupeFunc', function () {
    it('exists', function () {
        expect(noDupeFunc).not.toBeUndefined();
    });

    it('is a function', function () {
        expect(typeof noDupeFunc).toBe('function');
    });
});
