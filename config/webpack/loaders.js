/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

var loaders = [
    {
        test: /\.css$/,
        loader: 'style!css!autoprefixer',
    }, {
        test: /\.less$/,
        loader: 'style!css!autoprefixer!less',
    }, {
        test: /\.jade$/,
        loader: 'jade',
    }, {
        test: /\.6\.js$/,
        loader: 'babel',
    }, {
        test: /\.json$/,
        loader: 'json',
    }, {
        test: /\.(yaml|yml)$/,
        loader: 'json!yaml',
    }, {
        test: /\.(svg|woff|woff2|eot|dtd|png|gif|jpg|jpeg|ttf)(\?.*)?$/,
        loader: 'file',
    },
];

module.exports = loaders;
