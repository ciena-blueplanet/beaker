/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../../src/transplant')(__dirname);
var beaker = t.require('../index');
var cli = t.require('./index');

describe('cli.init', function () {
    var argv, ret;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(beaker.init, 'command').and.returnValue(13);
        ret = cli.init(argv);
    });

    it('calls init method', function () {
        expect(beaker.init.command).toHaveBeenCalledWith(argv);
    });

    it('returns result of init', function () {
        expect(ret).toBe(13);
    });
});
