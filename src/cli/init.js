/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

var beaker = require('../index');

/**
 * Process command line arguments and execute library code
 * @param {Argv} argv - the minimist argv command-line arguments
 * @returns {Number} 0 on success, > 0 on error
*/
module.exports = function (argv) {
    return beaker.init.command(argv);
};
