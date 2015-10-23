/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

'use strict';

require('./typedefs');

const fs = require('fs');
const path = require('path');

const throwCliError = require('./cli/utils').throwCliError;

module.exports = {

    /**
     * Create a default beaker.json file
     * @throws {CliError}
     */
    command() {
        var sourcePath = path.join(__dirname, '../files/beaker.json');
        var targetPath = path.join(process.cwd(), 'beaker.json');

        fs.readFile(sourcePath, (err, data) => {
            if (err) {
                throwCliError(err.message);
            }

            fs.writeFile(targetPath, data, (err2) => {
                if (err2) {
                    throwCliError(err2.message);
                }
            });
        });
    },
};
