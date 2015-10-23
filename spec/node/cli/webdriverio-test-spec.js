/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const t = require('../../../src/transplant')(__dirname);
const testerProto = t.require('../webdriverio-tester').proto;
const cli = t.require('./index');

describe('cli.webdriverioTester', () => {
    let argv;

    beforeEach(() => {
        argv = {_: ['init']};
        spyOn(testerProto, 'command');
        cli.webdriverioTester(argv);
    });

    it('calls tester method', () => {
        expect(testerProto.command).toHaveBeenCalledWith(argv);
    });
});
