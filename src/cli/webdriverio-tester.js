/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

'use strict';

require('../typedefs');

const tester = require('../webdriverio-tester')();

/**
 * Process command line arguments and execute library code
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
*/
module.exports = function (argv) {
    tester.command(argv);
};
