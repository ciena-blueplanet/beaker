/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../../src/transplant')(__dirname);
var beaker = t.require('../index');
var cli = t.require('./index');

describe('cli.newConfig', function () {
    var argv, ret;

    beforeEach(function () {
        argv = {_: ['newConfig']};
        spyOn(beaker.newConfig, 'command').and.returnValue(13);
        ret = cli.newConfig(argv);
    });

    it('calls newConfig method', function () {
        expect(beaker.newConfig.command).toHaveBeenCalledWith(argv);
    });

    it('returns result of init', function () {
        expect(ret).toBe(13);
    });
});
