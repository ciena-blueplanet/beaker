/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

var t = require('../../../src/transplant')(__dirname);
var init = t.require('../init');
var cli = t.require('./index');

describe('cli.init', function () {
    var argv;

    beforeEach(function () {
        argv = {_: ['init']};
        spyOn(init, 'command');
        cli.init(argv);
    });

    it('calls init method', function () {
        expect(init.command).toHaveBeenCalledWith(argv);
    });
});
