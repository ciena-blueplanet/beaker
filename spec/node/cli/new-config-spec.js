/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

var t = require('../../../src/transplant')(__dirname);
var newConfig = t.require('../new-config');
var cli = t.require('./index');

describe('cli.newConfig', function () {
    var argv;

    beforeEach(function () {
        argv = {_: ['newConfig']};
        spyOn(newConfig, 'command');
        cli.newConfig(argv);
    });

    it('calls newConfig method', function () {
        expect(newConfig.command).toHaveBeenCalledWith(argv);
    });
});
