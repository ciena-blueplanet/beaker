/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

'use strict';

require('./typedefs');

const fs = require('fs');
const path = require('path');
const changeCase = require('change-case');

const cliUtils = require('./cli/utils');
const config = require('./config');
const utils = require('./utils');

// 'Constants' to store some info so we con't calculate it more than once
const CWD = process.cwd();
const FILES_DIR = path.join(__dirname, '../files/project-templates');

/** @exports init */
module.exports = {
    /**
     * Take a name like 'cy-foo-bar-baz-ui' and convert to
     * foo-bar-baz, if it follows the pattern. Otherwise return
     * the string 'NON-APP'
     * @param {String} projectName - name of the project
     * @returns {String} - name without cruft
     */
    cleanupCruft(projectName) {
        var match = projectName.match(/^cy\-(.+)\-ui$/);

        if (match === null) {
            match = projectName.match(/^(.+)\-ui$/);
        }

        return (match === null) ? projectName : match[1];
    },

    /**
     * Actual functionality of the 'init' command
     * @param {MinimistArgv} argv - the minimist arguments object
     * @throws {CliError}
    */
    command(argv) {
        const _config = config.load(CWD);

        if (!_config) {
            let msg = 'beaker.json missing\n';
            msg += 'To create a default beaker.json file, run the following command: beaker newConfig';

            cliUtils.throwCliError(msg);
            return; // not really needed, but it is for testing when you spyOn throwCliError
        }

        // get today's year for copyright headers, etc.
        const today = new Date();
        const year = today.getFullYear();
        const projectName = utils.projectName;
        const cruftlessName = this.cleanupCruft(projectName);
        const projectType = argv.type;
        const templateData = {
            author: _config.author,
            company: _config.company,
            year: year,
            projectName: projectName,
            projectType: projectType,
            camelProjectName: changeCase.camel(projectName),
            githubHost: _config.github.host,
            githubUser: _config.github.user,
            npmRegistry: _config.npm.registry,
            beakerVersion: utils.pkg.version,
            seleniumHost: _config.selenium.host,
            seleniumPort: _config.selenium.port,
            seleniumBrowser: _config.selenium.browser,
            cruftlessName: cruftlessName,
            templateDir: _config.templateDir || FILES_DIR,
        };

        utils.copyDir('common', CWD, templateData);
        utils.copyDir(projectType, CWD, templateData);

        // clean up symlinks, if they exist
        ['src', 'spec', 'node-spec'].forEach((pathElement) => {
            const fullPath = path.join(CWD, pathElement, 'project-name');
            if (fs.existsSync(fullPath)) {
                fs.unlink(fullPath);
            }
        });
    },
};
