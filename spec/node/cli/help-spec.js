/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';


var t = require('../../../src/transplant')(__dirname);
var cli = t.require('./index');


describe('cli.help', function () {
    var argv;

    beforeEach(function () {
        argv = {
            _: ['help'],
        };
        spyOn(console, 'log');
        cli.help(argv);
    });

    it('does not blow up', function () {
        expect(true).toBeTruthy();
    });
});
