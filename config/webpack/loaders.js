/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

module.exports = [
    {
        test: /\.css$/,
        loader: 'style!css!postcss',
    }, {
        test: /\.less$/,
        loader: 'style!css!postcss!less',
    }, {
        test: /\.scss$/,
        loader: 'style!css!postcss!sass',
    }, {
        test: /\.sass$/,
        loader: 'style!css!postcss!sass?indentedSyntax',
    }, {
        test: /\.jade$/,
        loader: 'jade',
    }, {
        test: /\.6\.js$/,
        loader: process.env.JASMINE ? 'babel?plugins=babel-plugin-rewire' : 'babel',
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
