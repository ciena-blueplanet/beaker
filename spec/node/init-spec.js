/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const changeCase = require('change-case');

const _config = require('../../src/config');
const config = require('./sample-config.json');

const t = require('../../src/transplant')(__dirname);
const init = t.require('./init');
const utils = t.require('./utils');
const cliUtils = t.require('./cli/utils');
const CWD = process.cwd();

describe('init', () => {
    let testConfig;

    beforeEach(() => {
        testConfig = config;

        spyOn(cliUtils, 'throwCliError');
        spyOn(console, 'info');
        spyOn(console, 'error');
        spyOn(_config, 'load').and.callFake(() => {
            return testConfig;
        });
    });

    describe('.cleanupCruft()', () => {
        it('returns <project-name> for repository not named as cy-<project-name>-ui', () => {
            expect(init.cleanupCruft('project-name')).toEqual('project-name');
        });

        it('returns project name for repository named as cy-<project-name>-ui', () => {
            expect(init.cleanupCruft('cy-project-name-ui')).toEqual('project-name');
        });

        it('returns project name for repository named as <project-name>-ui', () => {
            expect(init.cleanupCruft('project-name-ui')).toEqual('project-name');
        });
    });

    describe('.command()', () => {
        const year = new Date().getFullYear();
        const projectName = path.basename(CWD);
        const templateData = {
            author: config.author,
            company: config.company,
            year: year,
            projectName: projectName,
            camelProjectName: changeCase.camel(projectName),
            githubHost: config.github.host,
            githubUser: config.github.user,
            npmRegistry: config.npm.registry,
            beakerVersion: t.require('../package.json').version,
            cruftlessName: 'beaker',
            seleniumHost: 'localhost',
            seleniumPort: 4444,
            seleniumBrowser: 'chrome',
            templateDir: path.join(CWD, 'files/project-templates'),
        };

        let symlinks, originalSymlinks;

        beforeEach(() => {
            symlinks = [
                path.join(CWD, 'src', 'project-name'),
                path.join(CWD, 'spec', 'project-name'),
                path.join(CWD, 'node-spec', 'project-name'),
            ];

            spyOn(fs, 'existsSync').and.callFake((fullPath) => {
                return _.includes(symlinks, fullPath);
            });
            spyOn(fs, 'unlink');
            spyOn(utils, 'copyDir');
        });

        describe('if config fails to load', () => {
            beforeEach((done) => {
                testConfig = null;
                init.command({
                    projectType: 'app',
                });
                setTimeout(done, 1);
            });

            it('throws an error', () => {
                expect(cliUtils.throwCliError).toHaveBeenCalled();
            });
        });

        _.forEach(['app', 'node', 'webpack'], (projectType) => {
            describe(projectType + ' project', () => {
                beforeEach(() => {
                    templateData.projectType = projectType;
                    originalSymlinks = symlinks;
                    symlinks = []; // so the exists calls all return false
                    init.command({
                        type: projectType,
                    });
                });

                afterEach(() => {
                    symlinks = originalSymlinks;
                });

                it('calls utils.copyDir for common project files', () => {
                    expect(utils.copyDir).toHaveBeenCalledWith('common', CWD, templateData);
                });

                it('calls utils.copyDir for ' + projectType + ' project files', () => {
                    expect(utils.copyDir).toHaveBeenCalledWith(projectType, CWD, templateData);
                });

                it('checks for symlinks', () => {
                    _.forEach(originalSymlinks, (symlink) => {
                        expect(fs.existsSync).toHaveBeenCalledWith(symlink);
                        expect(fs.unlink).not.toHaveBeenCalledWith(symlink);
                    });
                });
            });
        });
    });
});
