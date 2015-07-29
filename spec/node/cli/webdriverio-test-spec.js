/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var t = require('../../../src/transplant')(__dirname);
var tester = t.require('../webdriverio-tester');
var cli = t.require('./index');

describe('cli.webdriverioTester', function () {
    var argv;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(tester, 'command');
        cli.webdriverioTester(argv);
    });

    it('calls tester method', function () {
        expect(tester.command).toHaveBeenCalledWith(argv);
    });
});
