/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const t = require('../../../src/transplant')(__dirname);
const newConfig = t.require('../new-config');
const cli = t.require('./index');

describe('cli.newConfig', () => {
    let argv;

    beforeEach(() => {
        argv = {_: ['newConfig']};
        spyOn(newConfig, 'command');
        cli.newConfig(argv);
    });

    it('calls newConfig method', () => {
        expect(newConfig.command).toHaveBeenCalledWith(argv);
    });
});
