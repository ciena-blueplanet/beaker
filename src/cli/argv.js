/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

var _ = require('lodash');

/**
 * Print version info from package.json file
*/
function showVersion() {
    var pkgJSON = require('../../package.json');
    console.log(pkgJSON.name + ' v' + pkgJSON.version);
}

/**
 * Execute the appropriate command based on command-line arguments
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @returns {Number} 0 on success, > 0 on error.
 */
module.exports = function (argv) {
    // when no command given, default to 'help' (or version)
    if (argv._.length === 0) {

        if (argv.v || argv.version) {
            showVersion();
            return 0;
        }

        argv._.push('help');
    }

    var command = argv._[0];

    if (!_.has(this, command)) {
        console.error('Invalid command "' + command + '"');
        return 1;
    }

    return this[command](argv);
};
