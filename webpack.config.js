/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2105 Cyan, Inc. All rights reserved.
 */

'use strict';

var path = require('path');
var loaders = require('./config/webpack/loaders');
var resolve = require('./config/webpack/resolve');

module.exports = {
    entry: {
        demo: './demo/js/demo.6.js',
    },

    devtool: 'cheap-module-source-map',

    output: {
        path: 'demo/bundle',
        publicPath: 'bundle/',
        filename: 'demo-entry.js',
        pathinfo: true,
    },

    plugins: [],

    module: {
        preLoaders: [
            {
                test: /demo/,
                loader: path.join(process.cwd(), './config/karma/self-loader.js'),
            },
        ],
        loaders: loaders,
    },

    resolve: resolve,
};
