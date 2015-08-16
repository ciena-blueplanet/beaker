/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 * Allow code within a package to use it's own package name when using `require()`
 * This is specifically for writing tests, so you don't have to use a lot of `../../../src` type requires
*/

'use strict';

var rootPath = process.cwd();
var packageName = require(rootPath + '/package.json').name;

module.exports = function (source) {
    /* eslint-disable quotes */
    var requireRegex = new RegExp("require\\('" + packageName + "(\/[^']*)?'\\)", 'g');
    var importRegex = new RegExp("(import|from) '" + packageName + "(\/[^']*)?'", 'g');
    /* eslint-enable quotes */
    return source
        .replace(requireRegex, 'require(\'' + rootPath + '$1\')')
        .replace(importRegex, '$1 \'' + rootPath + '$2\'');
};
