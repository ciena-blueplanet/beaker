/**
 * Gruntfile for {{ projectName }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-filenames');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            files: [
                './Gruntfile.js',
                'bin/**/*.js',
                'config/**/*.js',
                'files/**/*.js',
                'src/**/*.js',
                'spec/**/*.js',
                '!src/eslint-rules/indent.js',
            ],

            options: {
                config: '.eslintrc',
                rulesdir: ['node_modules/beaker/src/eslint-rules'],
            },
        },

        filenames: {
            src: [
                'config/**/*.*',
                'src/**/*.*',
                'spec/**/*.*',
                'demo/**/*.*',
                '!**/Gruntfile.js',
                '!node_modules/**',
            ],

            options: {
                valid: /^_?[a-z0-9\-\.]+\.([^\.]+)$/,
            },
        },
    });

    grunt.registerTask('lint', ['eslint', 'filenames']);
    grunt.registerTask('default', []);
};
