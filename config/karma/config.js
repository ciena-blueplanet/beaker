/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var path = require('path');
var webpack = require('webpack');
var loaders = require('../webpack/loaders');
var resolve = require('../webpack/resolve');
var webpackPlugins = require('../webpack/karma-plugins');

var USE_SOURCE_MAPS = process.env.MAPS === 'on';
var KARMA_BROWSER = process.env.KARMA_BROWSER || 'Chrome';

var IS_BEAKER = process.env.IS_BEAKER === '1';
var BEAKER_DIR = IS_BEAKER ? './' : 'node_modules/beaker/';
var entryPoint = IS_BEAKER ? 'beaker-test-main.js' : 'test-main.js';
var entryPointFull = path.join(BEAKER_DIR, 'config/karma', entryPoint);

var preprocessors = {};
preprocessors[entryPointFull] = ['webpack', 'sourcemap'];

var frameworks = [];
var plugins = [
    require('karma-chrome-launcher'),
    require('karma-firefox-launcher'),
    require('karma-js-coverage'),
    require('karma-sourcemap-loader'),
    require('karma-spec-reporter'),
    require('karma-webpack'),
];

if (process.env.TEST_FRAMEWORK === 'mocha') {
    frameworks.push(
        'mocha',
        'chai-jquery',
        'sinon-chai',
        'jquery-2.1.0'
    );

    plugins.push(
        require('karma-chai-jquery'),
        require('karma-jquery'),
        require('karma-mocha'),
        require('karma-sinon-chai')
    );
} else {
    frameworks.push(
        'jasmine-jquery',
        'jasmine'
    );

    plugins.push(
        require('karma-jasmine-jquery'),
        require('karma-jasmine')
    );
}

module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: process.cwd(),

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: frameworks,

        // list of files / patterns to load in the browser
        files: [
            entryPointFull,
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: preprocessors,

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values:
        //      config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [KARMA_BROWSER],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,


        // Make sure browser doesn't timeout before tests can run
        browserNoActivityTimeout: 30000,


        webpack: {
            module: {
                preLoaders: [
                    {
                        test: /spec/,
                        loader: path.join(__dirname, 'self-loader.js'),
                    },
                ],
                loaders: loaders,
            },
            plugins: webpackPlugins,
            resolve: resolve,
            devtool: USE_SOURCE_MAPS ? 'inline-cheap-module-source-map' : 'eval',
        },

        webpackMiddleware: {
            noInfo: false,
        },

        plugins: plugins,

    });
};
