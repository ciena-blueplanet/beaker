/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

var path = require('path');
var loaders = require('beaker/config/webpack/loaders');
var resolve = require('beaker/config/webpack/resolve');

module.exports = {
    entry: {
        demo: './demo/js/demo.6.js',
    },

    devtool: 'source-map',

    output: {
        path: 'demo/bundle',
        publicPath: 'bundle/',
        filename: 'demo-entry.js',
        pathinfo: true,
    },

    plugins: [],

    module: {
        preLoaders: [{
            test: /demo/,
            loader: path.join(process.cwd(), 'node_modules/beaker/config/karma/self-loader.js'),
        }],
        loaders: loaders,
    },

    resolve: resolve,
};
