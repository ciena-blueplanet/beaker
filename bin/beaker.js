#!/usr/bin/env node

/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

'use strict';

const exit = require('exit');
const cli = require('../src/cli');
const argv = require('minimist')(process.argv.slice(2), {'boolean': 'app'});

process.on('uncaughtException', (err) => {
    var exitCode = 1;
    if (err.exitCode !== undefined) {
        exitCode = err.exitCode;
    }

    console.error(err.message);
    exit(exitCode);
});

cli.argv(argv);
