/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

require('./typedefs');

var fs = require('fs');
var path = require('path');

var throwCliError = require('./cli/utils').throwCliError;

var ns = {};

/**
 * Create a default beaker.json file
 * @throws {CliError}
 */
ns.command = function () {
    var sourcePath = path.join(__dirname, '../files/beaker.json');
    var targetPath = path.join(process.cwd(), 'beaker.json');

    fs.readFile(sourcePath, function (err, data) {
        if (err) {
            throwCliError(err.message);
        }

        fs.writeFile(targetPath, data, function (err2) {
            if (err2) {
                throwCliError(err2.message);
            }
        });
    });
};

module.exports = ns;
