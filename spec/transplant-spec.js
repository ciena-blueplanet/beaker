/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

var transplantModule = require('../src/transplant');

describe('transplant', function () {
    it('moves from spec/ tree to src/ tree', function () {
        var t = transplantModule(__dirname);
        expect(t.require('./init')).toEqual(require('../src/init'));
    });

    it('throws an error if used outside spec/ tree', function () {
        var t = transplantModule('/path/to/src/foo/bar');
        var errorMsg = 'Invalid srcPath [/path/to/src/foo/bar] no "spec" dir found!';
        expect(function () {
            t.require('./baz');
        }).toThrowError(errorMsg);
    });
});
