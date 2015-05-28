/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

require('../typedefs');

var _ = require('lodash');

/** obvious */
function showVersion() {
    var pkgJSON = require('../../package.json');
    console.log(pkgJSON.name + ' v' + pkgJSON.version);
}

/**
 * Execute the appropriate command based on command-line arguments
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
 */
module.exports = function (argv) {
    // when no command given, default to 'help' (or version)
    if (argv._.length === 0) {

        if (argv.v || argv.version) {
            showVersion();
            return;
        }

        argv._.push('help');
    }

    var command = argv._[0];

    if (!_.has(this, command)) {
        throw {
            message: 'Invalid command "' + command + '"',
            exitCode: 1,
        };
    }

    this[command](argv);
};
