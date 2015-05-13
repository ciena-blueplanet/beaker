#!/usr/bin/env node

/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

'use strict';

// Since this is a CLI and only a CLI, we actually want process.exit
/* eslint-disable no-process-exit */

var cli = require('../src/cli');
var argv = require('minimist')(process.argv.slice(2), {'boolean': 'app'});

var ret = cli.argv(argv);

process.exit(ret);
