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
const childProcess = require('child_process');
const path = require('path');
const util = require('util');

const config = require('./sample-config.json');

const t = require('../../src/transplant')(__dirname);
const packageJSON = t.require('../package.json');
const utils = t.require('./utils');

const CWD = process.cwd();

/**
 * @typedef {Object} CopyFileContext
 * @property {String} srcFilename - the source filename
 * @property {String} [destFilename] - the destination filename (if different than srcFilename)
 */

describe('utils', () => {
    let templateData;

    beforeEach(() => {
        templateData = {
            author: config.author,
            company: config.company,
            year: '2015',
            projectName: 'project-name',
            camelProjectName: 'projectName',
            githubHost: config.github.host,
            githubUser: config.github.user,
            npmRegistry: config.npm.registry,
            projectType: 'app',
            beakerVersion: packageJSON.version,
            cruftlessName: 'NON-APP',
            templateDir: path.join(CWD, 'files/project-templates'),
        };
    });

    it('exposes the projectName', () => {
        expect(utils.projectName).toBe(path.basename(CWD));
    });

    it('exposes the packageJSON info', () => {
        expect(utils.pkg).toEqual(packageJSON);
    });

    describe('.copyFile()', () => {
        beforeEach(() => {
            spyOn(fs, 'readFileSync').and.returnValue('file-contents');
            spyOn(fs, 'writeFileSync');
            spyOn(fs, 'statSync').and.returnValue({mode: 744});
            spyOn(fs, 'chmodSync');
        });

        describe('when file already exists', () => {
            beforeEach(() => {
                spyOn(console, 'log');
                spyOn(fs, 'existsSync').and.returnValue(true);
                utils.copyFile('common/myfile', CWD, templateData);
            });

            it('calls console.log()', () => {
                expect(console.log).toHaveBeenCalled();
            });


            it('does not call fs.readFileSync()', () => {
                expect(fs.readFileSync).not.toHaveBeenCalled();
            });
        });

        describe('when image', () => {
            beforeEach(() => {
                spyOn(fs, 'existsSync').and.returnValue(false);
            });

            let IMAGE_FILES = ['common/foo.png', 'common/bar.JPEG', 'common/baz.GIF', 'common/blah.jpg'];
            _.forEach(IMAGE_FILES, function (imageFilename) {
                describe('copying ' + imageFilename, () => {
                    let srcPath, destPath;

                    beforeEach(() => {
                        srcPath = path.join(templateData.templateDir, imageFilename);
                        destPath = path.join(CWD, utils.removeHeadDir(imageFilename));
                        utils.copyFile(imageFilename, CWD, templateData);
                    });

                    it('reads the file', () => {
                        expect(fs.readFileSync).toHaveBeenCalledWith(srcPath);
                    });

                    it('writes the file', () => {
                        expect(fs.writeFileSync).toHaveBeenCalledWith(destPath, 'file-contents');
                    });

                    it('calls fs.statSync()', () => {
                        expect(fs.statSync).toHaveBeenCalled();
                    });

                    it('calls fs.chmodSync()', () => {
                        expect(fs.chmodSync).toHaveBeenCalledWith(destPath, 744);
                    });
                });
            });
        });

        describe('when file is not image', () => {
            let destPath, srcPath;

            beforeEach(() => {
                spyOn(fs, 'existsSync').and.returnValue(false);

                srcPath = path.join(templateData.templateDir, 'common/myfile.txt');
                destPath = path.join(CWD, 'myfile.txt');

                utils.copyFile('common/myfile.txt', CWD, templateData);
            });

            it('calls fs.readFileSync()', () => {
                expect(fs.readFileSync).toHaveBeenCalledWith(srcPath, {encoding: 'utf-8'});
            });

            it('calls fs.writeFileSync()', () => {
                expect(fs.writeFileSync).toHaveBeenCalled();
            });

            it('calls fs.statSync()', () => {
                expect(fs.statSync).toHaveBeenCalled();
            });

            it('calls fs.chmodSync()', () => {
                expect(fs.chmodSync).toHaveBeenCalledWith(destPath, 744);
            });
        });
    });

    describe('.copyDir()', () => {
        let children;

        beforeEach(() => {
            children = ['sub-dir-1', 'sub-dir-2', 'file-1'];
            spyOn(fs, 'readdirSync').and.returnValue(children);
            spyOn(utils, 'mkdirSync');
            spyOn(utils, 'processPath');
            spyOn(utils, 'removeHeadDir').and.callThrough();

            utils.copyDir('common', 'full/path/to/dest', templateData);
        });

        it('calls removeHeadDir()', () => {
            expect(utils.removeHeadDir).toHaveBeenCalled();
        });

        it('calls mkdirSync()', () => {
            expect(utils.mkdirSync).toHaveBeenCalledWith('full/path/to/dest');
        });

        it('calls processPath() for each sub directories and files within directory', () => {
            expect(utils.processPath).toHaveBeenCalledWith(jasmine.any(String), 'full/path/to/dest', templateData);
            expect(utils.processPath.calls.count()).toEqual(children.length);
        });
    });

    describe('.exec()', () => {
        let fakeProcess;
        beforeEach(() => {
            fakeProcess = {
                stdout: {
                    on: jasmine.createSpy('fakeProcess.stdout.on'),
                },
                on: jasmine.createSpy('fakeProcess.on'),
            };

            spyOn(util, 'print');
            spyOn(childProcess, 'spawn').and.returnValue(fakeProcess);
            spyOn(console, 'log');
            utils.exec('common', 'testprogram.sh', '.');
        });

        it('adds stdout handler', () => {
            expect(fakeProcess.stdout.on).toHaveBeenCalledWith('data', jasmine.any(Function));
        });

        it('adds exit handler', () => {
            expect(fakeProcess.on).toHaveBeenCalledWith('exit', jasmine.any(Function));
        });

        it('runs a file', () => {
            expect(console.log.calls.argsFor(0)).toMatch(/running /);
        });

        it('prints out data', () => {
            fakeProcess.stdout.on.calls.argsFor(0)[1]('my-data');
            expect(util.print).toHaveBeenCalledWith('my-data');
        });

        it('reports success', () => {
            fakeProcess.on.calls.argsFor(0)[1](0);
            expect(console.log.calls.argsFor(1)).toMatch(/ succeeded\./);
        });

        it('reports failure', () => {
            fakeProcess.on.calls.argsFor(0)[1](1);
            expect(console.log.calls.argsFor(1)).toMatch(/ failed: 1/);
        });
    });

    describe('.mkdirSync()', () => {
        let isDir;

        beforeEach(() => {
            isDir = true;
            spyOn(fs, 'mkdirSync');
            spyOn(fs, 'statSync').and.returnValue({
                isDirectory: () => {
                    return isDir;
                },
            });
        });

        it('creates directory when not there', () => {
            spyOn(fs, 'existsSync').and.returnValue(false);
            utils.mkdirSync('foobar');
            expect(fs.mkdirSync).toHaveBeenCalledWith('foobar');
        });

        it('does not create directory when already there', () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            isDir = true;
            utils.mkdirSync('foobar');
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('throws an error when non-directory exists', () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            isDir = false;
            expect(() => {
                utils.mkdirSync('foobar');
            }).toThrowError('foobar should be a directory!');
        });
    });

    describe('.processPath()', () => {
        let isDir;

        beforeEach(() => {
            const stats = {
                isDirectory() {
                    return isDir;
                },
                isFile() {
                    return !isDir;
                },
            };

            spyOn(fs, 'statSync').and.returnValue(stats);
            spyOn(utils, 'copyDir');
            spyOn(utils, 'copyFile');
        });

        describe('for directory', () => {
            beforeEach(() => {
                isDir = true;
                utils.processPath('full/path', 'destination/path', templateData);
            });

            it('calls copyDir()', () => {
                expect(utils.copyDir).toHaveBeenCalled();
            });

            it('does not call copyFile()', () => {
                expect(utils.copyFile).not.toHaveBeenCalled();
            });
        });

        describe('for file', () => {
            beforeEach(() => {
                isDir = false;
                utils.processPath('full/path', 'destination/path', templateData);
            });

            it('does not call copyDir()', () => {
                expect(utils.copyDir).not.toHaveBeenCalled();
            });

            it('calls copyFile()', () => {
                expect(utils.copyFile).toHaveBeenCalled();
            });
        });
    });

    describe('.removeHeadDir()', () => {
        it('removes head directory without starting slash', () => {
            expect(utils.removeHeadDir('/head/or/tail')).toEqual('or/tail');
        });

        it('removes head directory with starting slash', () => {
            expect(utils.removeHeadDir('head/or/tail')).toEqual('or/tail');
        });

        _.forEach(['gitattributes', 'gitignore', 'gitfat'], function (fileName) {
            it('adds . to filename if filename is ' + fileName, () => {
                expect(utils.removeHeadDir('path/to/' + fileName)).toEqual('to/.' + fileName);
            });
        });
    });
});
