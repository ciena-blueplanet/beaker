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
