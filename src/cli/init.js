/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

'use strict';

require('../typedefs');

const init = require('../init');

/**
 * Call the init command
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
*/
module.exports = function (argv) {
    init.command(argv);
};
