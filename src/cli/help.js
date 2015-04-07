/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

var fs = require('fs');
var path = require('path');

/**
 * Help command, read help documentaiton for command and output it
 * @param {MinimistArgv} argv - the minimist argv command-line arguments
 * @returns {Number} 0 on succes, > 0 on error
*/
module.exports = function (argv) {
    var basePath, filePath, data;

    // filename format: command.command.txt
    filePath = argv._.slice(0);
    filePath.push('txt');
    filePath = filePath.join('.');

    // full doc path
    basePath = path.join(__dirname, '..', '..', 'cli-docs');
    filePath = path.join(basePath, filePath);

    // get help info
    data = fs.readFileSync(filePath, 'utf8');

    console.log('\n' + data + '\n');

    return 0;
};
