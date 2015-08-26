/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

var t = require('../../../src/transplant')(__dirname);
var testerProto = t.require('../webdriverio-tester').proto;
var cli = t.require('./index');

describe('cli.webdriverioTester', function () {
    var argv;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(testerProto, 'command');
        cli.webdriverioTester(argv);
    });

    it('calls tester method', function () {
        expect(testerProto.command).toHaveBeenCalledWith(argv);
    });
});
