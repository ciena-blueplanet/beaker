/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

var webpack = require('webpack');

module.exports = [
    new webpack.DefinePlugin({
        'process.env': {
            'JASMINE': process.env.JASMINE,
        },
    }),
];
