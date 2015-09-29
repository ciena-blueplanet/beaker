/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const _ = require('lodash');
const fs = require('fs');
const matchdep = require('matchdep');
const path = require('path');
const rimraf = require('rimraf');

const t = require('../../../src/transplant')(__dirname);
const helper = t.require('./helper');

describe('grunt helper', () => {

    describe('.init()', () => {
        let grunt, beakerTasks, localTasks;
        beforeEach(() => {
            spyOn(process, 'cwd').and.returnValue(path.join(__dirname, '_cwd'));
            grunt = jasmine.createSpyObj('grunt', ['loadNpmTasks', 'initConfig', 'registerTask', 'option']);
            grunt.log = {
                writeln: jasmine.createSpy('grunt.log.writeln'),
            };

            beakerTasks = ['beaker-task-1', 'grunt-cli', 'beaker-task-2'];
            localTasks = ['local-task-1', 'local-task-2'];
            spyOn(matchdep, 'filterAll').and.callFake((pattern, pkg) => {
                if (pkg) {
                    return localTasks;
                }

                return beakerTasks;
            });

            helper.init(grunt);
        });

        it('calls matchdep for beaker packages', () => {
            expect(matchdep.filterAll).toHaveBeenCalledWith('grunt-*');
        });

        it('loads the npm tasks from beaker', () => {
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('beaker-task-1', 0, ['beaker-task-1', 'beaker-task-2']);
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('beaker-task-2', 1, ['beaker-task-1', 'beaker-task-2']);
        });

        it('calls matchdep for local packages', () => {
            const pkgPath = path.join(process.cwd(), 'package.json');
            expect(matchdep.filterAll).toHaveBeenCalledWith('grunt-*', pkgPath);
        });

        it('loads the npm tasks from local', () => {
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('local-task-1', 0, localTasks);
            expect(grunt.loadNpmTasks).toHaveBeenCalledWith('local-task-2', 1, localTasks);
        });

        it('initializes grunt', () => {
            expect(grunt.initConfig).toHaveBeenCalled();
        });

        it('registers the default task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('default', ['webpack-dev-server:start']);
        });

        it('registers the dev task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('dev', ['webpack:build-dev', 'watch:app']);
        });

        it('registers the build task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('build', ['webpack:build']);
        });

        it('registers the lint task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('lint', ['filenames']);
        });

        it('registers the test task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('test', ['karma:ci']);
        });

        it('registers the post-coverage task', () => {
            const description = 'Move coverage report to a more browser-friendly location';
            expect(grunt.registerTask).toHaveBeenCalledWith('post-coverage', description, jasmine.any(Function));
        });

        it('gives post-coverage task a call to moveCoverageUp', () => {
            spyOn(helper, 'moveCoverageUp');

            const callback = grunt.registerTask.calls.argsFor(5)[2];
            callback();

            const coverageDir = path.join(process.cwd(), 'coverage');
            expect(helper.moveCoverageUp).toHaveBeenCalledWith(coverageDir, grunt.log.writeln);
        });

        it('registers the test-coverage task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('test-coverage', ['karma:coverage', 'post-coverage']);
        });
    });

    describe('.moveCoverageUp()', () => {
        let logFn, dirContents;

        beforeEach(() => {
            logFn = jasmine.createSpy('logFn');
            dirContents = {
                'coverage-dir': ['sub-dir'],
                'coverage-dir/sub-dir': [
                    'file1.txt',
                    'sub-sub-dir',
                    'file2.txt',
                ],
            };

            spyOn(fs, 'readdirSync').and.callFake((dir) => {
                return dirContents[dir];
            });

            spyOn(fs, 'renameSync');
            spyOn(rimraf, 'sync');

            helper.moveCoverageUp('coverage-dir', logFn);
        });

        it('outputs log info', () => {
            expect(logFn).toHaveBeenCalledWith('found coverage directory at: coverage-dir/sub-dir');
            expect(logFn).toHaveBeenCalledWith('moved all files to: coverage-dir');
        });

        it('moves all files', () => {
            const src = (filename) => {
                return 'coverage-dir/sub-dir/' + filename;
            };

            const dest = (filename) => {
                return 'coverage-dir/' + filename;
            };

            const files = dirContents['coverage-dir/sub-dir'];

            _.forEach(files, (filename) => {
                expect(rimraf.sync).toHaveBeenCalledWith(dest(filename));
                expect(fs.renameSync).toHaveBeenCalledWith(src(filename), dest(filename));
            });
        });

        it('removes the sub-dir', () => {
            expect(rimraf.sync).toHaveBeenCalledWith('coverage-dir/sub-dir');
        });
    });
});
