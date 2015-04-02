/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../src/transplant')(__dirname);
var beaker = t.require('./index');

describe('main module entry point', function () {
    it('defines gruntHelper', function () {
        expect(beaker.gruntHelper).not.toBeUndefined();
    });
});
