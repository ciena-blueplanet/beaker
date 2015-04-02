/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

var loaders = require('beaker/config/webpack/loaders');
var resolve = require('beaker/config/webpack/resolve');

module.exports = {
    entry: {
        app: './src/index.6.js',
    },

    output: {
        path: 'bundle',
        publicPath: 'bundle/',
        filename: 'app-entry.js',
        pathinfo: true,
    },

    plugins: [],

    module: {
        loaders: loaders,
    },

    resolve: resolve,
};
