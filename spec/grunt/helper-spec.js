/**
 * @author Adam Meadows [@adammeadows](https://github.com/adammeadows)
 * @copyright 2014-2015 Cyan, Inc. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var matchdep = require('matchdep');
var path = require('path');
var rimraf = require('rimraf');

var t = require('../../src/transplant')(__dirname);
var helper = t.require('./helper');

describe('grunt helper', function () {

    describe('.init()', function () {
        var grunt, toolkitTasks, localTasks;
        beforeEach(function () {
            spyOn(process, 'cwd').and.returnValue(path.join(__dirname, '_cwd'));
            grunt = jasmine.createSpyObj('grunt', ['loadNpmTasks', 'initConfig', 'registerTask']);
            grunt.log = {
                writeln: jasmine.createSpy('grunt.log.writeln'),
            };

            toolkitTasks = ['toolkit-task-1', 'grunt-cli', 'toolkit-task-2'];
            localTasks = ['local-task-1', 'local-task-2'];
            spyOn(matchdep, 'filterAll').and.callFake(function (pattern, pkg) {
                if (pkg) {
                    return localTasks;
                }

                return toolkitTasks;
            });

            helper.init(grunt);
        });

        it('calls matchdep for toolkit packages', function () {
            expect(matchdep.filterAll).toHaveBeenCalledWith('grunt-*');
        });

        it('loads the npm tasks from toolkit', function () {
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('toolkit-task-1', 0, ['toolkit-task-1', 'toolkit-task-2']);
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('toolkit-task-2', 1, ['toolkit-task-1', 'toolkit-task-2']);
        });

        it('calls matchdep for local packages', function () {
            var pkgPath = path.join(process.cwd(), 'package.json');
            expect(matchdep.filterAll).toHaveBeenCalledWith('grunt-*', pkgPath);
        });

        it('loads the npm tasks from local', function () {
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('local-task-1', 0, localTasks);
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('local-task-2', 1, localTasks);
        });

        it('initializes grunt', function () {
            expect(grunt.initConfig).toHaveBeenCalled();
        });

        it('registers the default task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('default', ['webpack-dev-server:start']);
        });

        it('registers the dev task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('dev', ['webpack:build-dev', 'watch:app']);
        });

        it('registers the build task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('build', ['webpack:build']);
        });

        it('registers the lint task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('lint', ['eslint', 'filenames']);
        });

        it('registers the test task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('test', ['karma:ci']);
        });

        it('registers the post-coverage task', function () {
            var description = 'Move coverage report to a more browser-friendly location';
            expect(grunt.registerTask).toHaveBeenCalledWith('post-coverage', description, jasmine.any(Function));
        });

        it('gives post-coverage task a call to moveCoverageUp', function () {
            spyOn(helper, 'moveCoverageUp');

            var callback = grunt.registerTask.calls.argsFor(5)[2];
            callback();

            var coverageDir = path.join(process.cwd(), 'coverage');
            expect(helper.moveCoverageUp).toHaveBeenCalledWith(coverageDir, grunt.log.writeln);
        });

        it('registers the test-coverage task', function () {
            expect(grunt.registerTask).toHaveBeenCalledWith('test-coverage', ['karma:coverage', 'post-coverage']);
        });
    });

    describe('.moveCoverageUp()', function () {
        var logFn, dirContents;

        beforeEach(function () {
            logFn = jasmine.createSpy('logFn');
            dirContents = {
                'coverage-dir': ['sub-dir'],
                'coverage-dir/sub-dir': [
                    'file1.txt',
                    'sub-sub-dir',
                    'file2.txt',
                ],
            };

            spyOn(fs, 'readdirSync').and.callFake(function (dir) {
                return dirContents[dir];
            });

            spyOn(fs, 'renameSync');
            spyOn(rimraf, 'sync');

            helper.moveCoverageUp('coverage-dir', logFn);
        });

        it('outputs log info', function () {
            expect(logFn).toHaveBeenCalledWith('found coverage directory at: coverage-dir/sub-dir');
            expect(logFn).toHaveBeenCalledWith('moved all files to: coverage-dir');
        });

        it('moves all files', function () {
            var src = function (filename) {
                return 'coverage-dir/sub-dir/' + filename;
            };

            var dest = function (filename) {
                return 'coverage-dir/' + filename;
            };

            var files = dirContents['coverage-dir/sub-dir'];

            _.each(files, function (filename) {
                expect(rimraf.sync).toHaveBeenCalledWith(dest(filename));
                expect(fs.renameSync).toHaveBeenCalledWith(src(filename), dest(filename));
            });
        });

        it('removes the sub-dir', function () {
            expect(rimraf.sync).toHaveBeenCalledWith('coverage-dir/sub-dir');
        });
    });
});
