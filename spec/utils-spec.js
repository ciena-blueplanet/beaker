/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');

var config = require('./sample-config.json');
var packageJSON = require('../package.json');
var t = require('../src/transplant')(__dirname);
var utils = t.require('./utils');

var CWD = process.cwd();

/**
 * @typedef {Object} CopyFileContext
 * @property {String} srcFilename - the source filename
 * @property {String} [destFilename] - the destination filename (if different than srcFilename)
 */

describe('utils', function () {
    var templateData;

    beforeEach(function () {
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
            beakerVersion: require('../package.json').version,
            cruftlessName: 'NON-APP',
            templateDir: path.join(CWD, 'files/project-templates'),
        };
    });

    it('exposes the projectName', function () {
        expect(utils.projectName).toBe(path.basename(CWD));
    });

    it('exposes the packageJSON info', function () {
        expect(utils.pkg).toEqual(packageJSON);
    });

    describe('.copyFile()', function () {
        describe('when file already exists', function () {
            beforeEach(function () {
                spyOn(console, 'log');
                spyOn(fs, 'createReadStream');
                spyOn(fs, 'existsSync').and.returnValue(true);
                spyOn(fs, 'readFileSync');

                utils.copyFile('common/myfile', CWD, templateData);
            });

            it('calls console.log()', function () {
                expect(console.log).toHaveBeenCalled();
            });

            it('does not call fs.createReadStream()', function () {
                expect(fs.createReadStream).not.toHaveBeenCalled();
            });

            it('does not call fs.readFileSync()', function () {
                expect(fs.readFileSync).not.toHaveBeenCalled();
            });
        });

        describe('when image', function () {
            var inStr, outStr;
            var IMAGE_FILES = ['common/foo.png', 'common/bar.JPEG', 'common/baz.GIF', 'common/blah.jpg'];

            beforeEach(function () {
                inStr = {
                    pipe: jasmine.createSpy(),
                };
                outStr = 'my-output-stream';

                spyOn(fs, 'createReadStream').and.returnValue(inStr);
                spyOn(fs, 'createWriteStream').and.returnValue(outStr);
            });

            _.each(IMAGE_FILES, function (imageFilename) {
                describe('copying ' + imageFilename, function () {
                    var srcPath, dstPath;

                    beforeEach(function () {
                        srcPath = path.join(templateData.templateDir, imageFilename);
                        dstPath = path.join(CWD, utils.removeHeadDir(imageFilename));
                        utils.copyFile(imageFilename, CWD, templateData);
                    });

                    it('creates a read stream', function () {
                        expect(fs.createReadStream).toHaveBeenCalledWith(srcPath);
                    });

                    it('creates a write stream', function () {
                        expect(fs.createWriteStream).toHaveBeenCalledWith(dstPath);
                    });

                    it('pipes in to out', function () {
                        expect(inStr.pipe).toHaveBeenCalledWith(outStr);
                    });
                });
            });
        });

        describe('when file is not image', function () {
            var destPath, srcPath;

            beforeEach(function () {
                spyOn(fs, 'chmodSync');
                spyOn(fs, 'existsSync').and.returnValue(false);
                spyOn(fs, 'readFileSync');
                spyOn(fs, 'statSync').and.returnValue({mode: 744});
                spyOn(fs, 'writeFileSync');

                srcPath = path.join(templateData.templateDir, 'common/myfile.txt');
                destPath = path.join(CWD, 'myfile.txt');

                utils.copyFile('common/myfile.txt', CWD, templateData);
            });

            it('calls fs.readFileSync()', function () {
                expect(fs.readFileSync).toHaveBeenCalledWith(srcPath, {encoding: 'utf-8'});
            });

            it('calls fs.writeFileSync()', function () {
                expect(fs.writeFileSync).toHaveBeenCalled();
            });

            it('calls fs.statSync()', function () {
                expect(fs.statSync).toHaveBeenCalled();
            });

            it('calls fs.chmodSync()', function () {
                expect(fs.chmodSync).toHaveBeenCalledWith(destPath, 744);
            });
        });
    });

    describe('.copyDir()', function () {
        var children;

        beforeEach(function () {
            children = ['sub-dir-1', 'sub-dir-2', 'file-1'];
            spyOn(fs, 'readdirSync').and.returnValue(children);
            spyOn(utils, 'mkdirSync');
            spyOn(utils, 'processPath');
            spyOn(utils, 'removeHeadDir').and.callThrough();

            utils.copyDir('common', 'full/path/to/dest', templateData);
        });

        it('calls removeHeadDir()', function () {
            expect(utils.removeHeadDir).toHaveBeenCalled();
        });

        it('calls mkdirSync()', function () {
            expect(utils.mkdirSync).toHaveBeenCalledWith('full/path/to/dest');
        });

        it('calls processPath() for each sub directories and files within directory', function () {
            expect(utils.processPath).toHaveBeenCalledWith(jasmine.any(String), 'full/path/to/dest', templateData);
            expect(utils.processPath.calls.count()).toEqual(children.length);
        });
    });

    describe('.exec()', function () {
        beforeEach(function () {
            var fakeProcess = {
                stdout: {
                    on: function () {}
                },
                on: function (evtName, callback) {
                    if (evtName === 'exit') {
                        callback(0);
                    }
                }
            };

            spyOn(childProcess, 'spawn').and.returnValue(fakeProcess);
            spyOn(console, 'log');
        });

        it('runs a file', function () {
            utils.exec('common', 'testprogram.sh', '.');
            expect(console.log.calls.argsFor(1)).toMatch(/ succeeded\./);
        });
    });

    describe('.mkdirSync()', function () {
        var isDir;

        beforeEach(function () {
            isDir = true;
            spyOn(fs, 'mkdirSync');
            spyOn(fs, 'statSync').and.returnValue({
                isDirectory: function () {
                    return isDir;
                },
            });
        });

        it('creates directory when not there', function () {
            spyOn(fs, 'existsSync').and.returnValue(false);
            utils.mkdirSync('foobar');
            expect(fs.mkdirSync).toHaveBeenCalledWith('foobar');
        });

        it('does not create directory when already there', function () {
            spyOn(fs, 'existsSync').and.returnValue(true);
            isDir = true;
            utils.mkdirSync('foobar');
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('throws an error when non-directory exists', function () {
            spyOn(fs, 'existsSync').and.returnValue(true);
            isDir = false;
            expect(function () {
                utils.mkdirSync('foobar');
            }).toThrowError('foobar should be a directory!');
        });
    });

    describe('.processPath()', function () {
        var isDir;

        beforeEach(function () {
            var stats = {
                isDirectory: function () {
                    return isDir;
                },
                isFile: function () {
                    return !isDir;
                },
            };

            spyOn(fs, 'statSync').and.returnValue(stats);
            spyOn(utils, 'copyDir');
            spyOn(utils, 'copyFile');
        });

        describe('for directory', function () {
            beforeEach(function () {
                isDir = true;
                utils.processPath('full/path', 'destination/path', templateData);
            });

            it('calls copyDir()', function () {
                expect(utils.copyDir).toHaveBeenCalled();
            });

            it('does not call copyFile()', function () {
                expect(utils.copyFile).not.toHaveBeenCalled();
            });
        });

        describe('for file', function () {
            beforeEach(function () {
                isDir = false;
                utils.processPath('full/path', 'destination/path', templateData);
            });

            it('does not call copyDir()', function () {
                expect(utils.copyDir).not.toHaveBeenCalled();
            });

            it('calls copyFile()', function () {
                expect(utils.copyFile).toHaveBeenCalled();
            });
        });
    });

    describe('.removeHeadDir()', function () {
        it('removes head directory without starting slash', function () {
            expect(utils.removeHeadDir('/head/or/tail')).toEqual('or/tail');
        });

        it('removes head directory with starting slash', function () {
            expect(utils.removeHeadDir('head/or/tail')).toEqual('or/tail');
        });

        _.each(['gitattributes', 'gitignore', 'gitfat'], function (fileName) {
            it('adds . to filename if filename is ' + fileName, function () {
                expect(utils.removeHeadDir('path/to/' + fileName)).toEqual('to/.' + fileName);
            });
        });
    });
});
