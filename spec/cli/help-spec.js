/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';


var t = require('../../src/transplant')(__dirname);
var cli = t.require('./index');


describe('cli.help', function () {
    var argv, ret;

    beforeEach(function () {
        argv = {
            _: ['help'],
        };
        spyOn(console, 'log');
    });

    it('returns 0', function () {
        ret = cli.help(argv);
        expect(ret).toBe(0);
    });
});
