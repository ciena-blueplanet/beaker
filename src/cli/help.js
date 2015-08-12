/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

var fs = require('fs');
var path = require('path');

var throwCliError = require('./utils').throwCliError;

/**
 * Help command, read help documentaiton for command and output it
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @throws {CliError}
*/
module.exports = function (argv) {
    var basePath, filePath;

    // filename format: command.command.txt
    filePath = argv._.slice(0);
    filePath.push('txt');
    filePath = filePath.join('.');

    // full doc path
    basePath = path.join(__dirname, '..', '..', 'cli-docs');
    filePath = path.join(basePath, filePath);

    // get help info
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            throwCliError(err.message);
        }

        console.log('\n' + data + '\n');
    });
};
