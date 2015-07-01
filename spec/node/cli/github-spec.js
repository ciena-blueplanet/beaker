/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../../../src/transplant')(__dirname);
var githubProto = t.require('../github').proto;
var cli = t.require('./index');

describe('cli.github', function () {
    var argv;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(githubProto, 'command');
        cli.github(argv);
    });

    it('calls github method', function () {
        expect(githubProto.command).toHaveBeenCalledWith(argv);
    });
});
