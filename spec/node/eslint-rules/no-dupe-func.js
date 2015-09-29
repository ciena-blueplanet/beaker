/**
 * @file spec for no-dupe-func eslint rule
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

'use strict';

const t = require('../../../src/transplant')(__dirname);
const noDupeFunc = t.require('./no-dupe-func');

describe('noDupeFunc', () => {
    it('exists', () => {
        expect(noDupeFunc).not.toBeUndefined();
    });

    it('is a function', () => {
        expect(typeof noDupeFunc).toBe('function');
    });
});
