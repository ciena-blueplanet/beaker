/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 * Allow code within a package to use it's own package name when using `require()`
 * This is specifically for writing tests, so you don't have to use a lot of `../../../src` type requires
*/

'use strict';

const rootPath = process.cwd();
const packageName = require(rootPath + '/package.json').name;

module.exports = function (source) {
    /* eslint-disable quotes */
    const requireRegex = new RegExp("require\\('" + packageName + "(\/[^']*)?'\\)", 'g');
    const importRegex = new RegExp("(import|from) '" + packageName + "(\/[^']*)?'", 'g');
    /* eslint-enable quotes */
    return source
        .replace(requireRegex, 'require(\'' + rootPath + '$1\')')
        .replace(importRegex, '$1 \'' + rootPath + '$2\'');
};
