/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

require('../typedefs');

var tester = require('../webdriverio-tester');

/**
 * Process command line arguments and execute library code
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
*/
module.exports = function (argv) {
    tester.command(argv);
};
