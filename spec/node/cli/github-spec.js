/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const t = require('../../../src/transplant')(__dirname);
const githubProto = t.require('../github').proto;
const cli = t.require('./index');
const config = t.require('../config');
const _config = require('../sample-config.json');

describe('cli.github', () => {
    let argv;

    beforeEach(() => {
        argv = {_: ['init']};
        spyOn(githubProto, 'command');
        spyOn(config, 'load').and.returnValue(_config);
        cli.github(argv);
    });

    it('calls github method', () => {
        expect(githubProto.command).toHaveBeenCalledWith(argv);
    });
});
