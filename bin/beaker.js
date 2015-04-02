#!/usr/bin/env node

/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

// Since this is a CLI and only a CLI, we actually want process.exit
/* eslint-disable no-process-exit */

var cli = require('../src/cli');
var argv = require('minimist')(process.argv.slice(2));

var ret = cli.argv(argv);

process.exit(ret);
