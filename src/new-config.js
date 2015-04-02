/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var fs = require('fs');
var path = require('path');

// 'Constants' to store some info so we con't calculate it more than once
var CWD = process.cwd();

var ns = {};

ns.command = function () {
    var sourcePath = path.join(__dirname, '../files/beaker.json');
    var targetPath = path.join(CWD, 'beaker.json');
    fs.writeFileSync(targetPath, fs.readFileSync(sourcePath));
};

module.exports = ns;
