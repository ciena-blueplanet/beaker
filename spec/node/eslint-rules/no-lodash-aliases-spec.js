/**
 * @file spec for no-lodash-alias eslint rule
 * @copyright 2014-2015 Ciena Corporation. All rights reserved
*/

'use strict';

const t = require('../../../src/transplant')(__dirname);
const noAliases = t.require('./no-lodash-aliases');

describe('noAliases', () => {
    // NOTE: We don't have a proper test for the indent rule
    // because we did not write it, but rather took it from
    // https://github.com/nodeca/eslint-plugin-nodeca/blob/master/lib/no-lodash-aliases.js
    it('exists', () => {
        expect(noAliases).not.toBeUndefined();
    });

    it('is a function', () => {
        expect(typeof noAliases).toBe('function');
    });
});
