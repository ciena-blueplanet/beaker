/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../../../src/transplant')(__dirname);
var github = t.require('../github');
var cli = t.require('./index');

describe('cli.github', function () {
    var argv, ret;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(github, 'command').and.returnValue(13);
        ret = cli.github(argv);
    });

    it('calls github method', function () {
        expect(github.command).toHaveBeenCalledWith(argv);
    });

    it('returns result of init', function () {
        expect(ret).toBe(13);
    });
});
