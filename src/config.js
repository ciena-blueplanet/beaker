/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var ns = {};

/**
 * Load config file from path (if not found checks parent directories)
 * @param {String} dir - path to load config file from
 * @returns {Object} configuraiton
 */
ns.load = function (dir) {
    var config;

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
        selenium: {
            host: 'localhost',
            port: 4444,
            browser: 'chrome',
        },
        npm: {
            registry: 'https://registry.npmjs.com',
        },
    });
};

module.exports = ns;
