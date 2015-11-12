/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

'use strict';

const rewirePlugin = (process.env.JASMINE) ? 'plugins[]=rewire&' : '';
const es6Loader = `babel?${rewirePlugin}plugins[]=object-assign`;

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
        loader: es6Loader,
    }, {
        test: /\.tsx?$/,
        loader: 'babel?plugins=object-assign!ts-loader',
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
