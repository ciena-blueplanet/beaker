/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

/**
 * Load config file from path (if not found checks parent directories)
 * @param {String} dir - path to load config file from
 * @returns {Object} configuraiton
 */
module.exports = function (dir) {
    let config;

    while (!config && dir.length > 1) {
        try {
            config = JSON.parse(fs.readFileSync(path.join(dir, 'beaker.json'), 'utf8'));
        } catch (e) {
            dir = path.join(dir, '../');
        }
    }

    if (!config) {
        return null;
    }

    return _.defaults(config, {
        github: {
            host: 'github.com',
        },
        npm: {
            registry: 'http://npmjs.org',
        },
    });
};
