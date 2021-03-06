/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

'use strict';

require('../typedefs');

const newConfig = require('../new-config');

/**
 * Process command line arguments and execute library code
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
*/
module.exports = function (argv) {
    newConfig.command(argv);
};
