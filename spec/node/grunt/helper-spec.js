/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

/* eslint-disable max-nested-callbacks */

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const matchdep = require('matchdep');
const path = require('path');

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
            expect(grunt.registerTask).toHaveBeenCalledWith('post-coverage', '', jasmine.any(Function));
        });

        it('registers the test-coverage task', () => {
            expect(grunt.registerTask).toHaveBeenCalledWith('test-coverage', ['karma:coverage', 'post-coverage']);
        });
    });
});
