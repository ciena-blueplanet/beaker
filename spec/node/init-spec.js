/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var changeCase = require('change-case');

var _config = require('../../src/config');
var config = require('./sample-config.json');

var t = require('../../src/transplant')(__dirname);
var init = t.require('./init');
var utils = t.require('./utils');
var cliUtils = t.require('./cli/utils');
var CWD = process.cwd();

describe('init', function () {
    var testConfig;

    beforeEach(function () {
        testConfig = config;

        spyOn(cliUtils, 'throwCliError');
        spyOn(console, 'info');
        spyOn(console, 'error');
        spyOn(_config, 'load').and.callFake(function () {
            return testConfig;
        });
    });

    describe('.cleanupCruft()', function () {
        it('returns NON-APP for repository not named as cy-<project-name>-ui', function () {
            expect(init.cleanupCruft('project-name')).toEqual('NON-APP');
        });

        it('returns project name for repository named as cy-<project-name>-ui', function () {
            expect(init.cleanupCruft('cy-project-name-ui')).toEqual('project-name');
        });
    });

    describe('.command()', function () {
        var year = new Date().getFullYear();
        var projectName = path.basename(CWD);
        var templateData = {
            author: config.author,
            company: config.company,
            year: year,
            projectName: projectName,
            camelProjectName: changeCase.camel(projectName),
            githubHost: config.github.host,
            githubUser: config.github.user,
            npmRegistry: config.npm.registry,
            beakerVersion: t.require('../package.json').version,
            cruftlessName: 'NON-APP',
            seleniumHost: 'localhost',
            seleniumPort: 4444,
            seleniumBrowser: 'chrome',
            templateDir: path.join(CWD, 'files/project-templates'),
        };

        var symlinks, originalSymlinks;

        beforeEach(function () {
            symlinks = [
                path.join(CWD, 'src', 'project-name'),
                path.join(CWD, 'spec', 'project-name'),
                path.join(CWD, 'node-spec', 'project-name'),
            ];

            spyOn(fs, 'existsSync').and.callFake(function (fullPath) {
                return _.contains(symlinks, fullPath);
            });
            spyOn(fs, 'unlink');
            spyOn(utils, 'copyDir');
        });

        describe('if config fails to load', function () {
            beforeEach(function (done) {
                testConfig = null;
                init.command({
                    projectType: 'app',
                });
                setTimeout(done, 1);
            });

            it('throws an error', function () {
                expect(cliUtils.throwCliError).toHaveBeenCalled();
            });
        });

        _.forEach(['app', 'node', 'webpack'], function (projectType) {
            describe(projectType + ' project', function () {
                beforeEach(function () {
                    templateData.projectType = projectType;
                    originalSymlinks = symlinks;
                    symlinks = []; // so the exists calls all return false
                    init.command({
                        type: projectType,
                    });
                });

                afterEach(function () {
                    symlinks = originalSymlinks;
                });

                it('calls utils.copyDir for common project files', function () {
                    expect(utils.copyDir).toHaveBeenCalledWith('common', CWD, templateData);
                });

                it('calls utils.copyDir for ' + projectType + ' project files', function () {
                    expect(utils.copyDir).toHaveBeenCalledWith(projectType, CWD, templateData);
                });

                it('checks for symlinks', function () {
                    _.forEach(originalSymlinks, function (symlink) {
                        expect(fs.existsSync).toHaveBeenCalledWith(symlink);
                        expect(fs.unlink).not.toHaveBeenCalledWith(symlink);
                    });
                });
            });
        });
    });
});
