/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
 */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var sys = require('sys');
var childProcess = require('child_process');

/** @exports utils */
var ns = {
    projectName: path.basename(process.cwd()),
    pkg: require('../package.json'),
};

// 'Constants' to store some info so we con't calculate it more than once
var SCRIPTS_DIR = path.join(__dirname, '../scripts/project-templates');
var INSERT_DOT = ['gitattributes', 'gitignore', 'gitfat'];

/**
 * Process a system path (file or directory) and copy it to a destination
 *
 * @param {String} fullPath - path to file or directory
 * @param {String} destination - the destination directory
 * @param {Object} [data] - template data to replace in the source file
 */
ns.processPath = function (fullPath, destination, data) {
    var stats = fs.statSync(fullPath);

    // Make path relative to files directory
    var relPath = fullPath.replace(data.templateDir, '');

    if (stats.isDirectory()) {
        ns.copyDir(relPath, destination, data);
    } else if (stats.isFile()) {
        ns.copyFile(relPath, destination, data);
    }
};

/**
 * Get file path without head directory
 *
 * @param {String} filePath - path to file or directory
 * @returns {String} file path with head directory removed
 */
ns.removeHeadDir = function (filePath) {
    var parts = filePath.split(path.sep);

    // Remove directory from front of path
    // i.e.
    //   common/some/path -> some/path
    //   /common/some/path -> some/path
    if (parts.shift() === '') {
        parts.shift();
    }

    if (parts.length !== 0 && _.indexOf(INSERT_DOT, parts[parts.length - 1]) !== -1) {
        parts[parts.length - 1] = '.' + parts[parts.length - 1];
    }

    return parts.join(path.sep);
};

/**
 * Wrapper for fs.mkdirSync which first checks if the directory already exists
 * if the directory already exists, nothing is done
 *
 * @param {String} fullPath - the full path to the directory you want to create
 * @throws Will throw an error if anything but a directory exists at {@link fullPath}
 * @returns {void}
 */
ns.mkdirSync = function (fullPath) {
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
        return;
    }

    var stats = fs.statSync(fullPath);

    if (!stats.isDirectory()) {
        throw new Error(fullPath + ' should be a directory!');
    }
};

/**
 * Helper to copy a file from the files/ directory to the given destination
 * If a file already exists at that destination, a warning is printed,
 * but nothing is done.
 *
 * @param {String} filename - the source file to copy
 * @param {String} destination - the destination directory
 * @param {Object} [data] - template data to replace in the source file
 *
 * @returns {void}
 */
ns.copyFile = function (filename, destination, data) {
    var relFileName = ns.removeHeadDir(filename);
    var dstPath = path.join(destination, relFileName);

    if (fs.existsSync(dstPath)) {
        console.log('WARNING: file already exists at [' + dstPath + '], skipping.');
        return;
    }

    var srcPath = path.join(data.templateDir, filename);
    var extension = filename.split('.').pop().toLowerCase();

    var contents;
    if (_.contains(['png', 'gif', 'jpg', 'jpeg'], extension)) {
        contents = fs.readFileSync(srcPath);
        fs.writeFileSync(dstPath, contents);
    } else {
        contents = fs.readFileSync(srcPath, {encoding: 'utf-8'});

        if (data) {
            contents = _.template(contents, {
                interpolate: /\{\{(.+?)\}\}/g,
            })(data);
        }

        fs.writeFileSync(dstPath, contents);
    }

    // restore original permissions
    var mode = fs.statSync(srcPath).mode;
    fs.chmodSync(dstPath, mode);
};

/**
 * Helper to copy project template files to the given destination
 *
 * @param {String} dir - the directory to copy relative to the root template files directory
 * @param {String} destination - the destination directory
 * @param {Object} [data] - template data to replace in the source file
 */
ns.copyDir = function (dir, destination, data) {
    var destPath = path.join(destination, ns.removeHeadDir(dir));
    var srcPath = path.join(data.templateDir, dir);

    // Make directory in destination
    ns.mkdirSync(destPath);

    // Iterate contents of directory
    _.forEach(fs.readdirSync(srcPath), function (relPath) {
        var fullPath = path.join(srcPath, relPath);
        ns.processPath(fullPath, destination, data);
    });
};

/**
 * Helper to run a script file after everything has been copied.
 * @param {String} type - the type of project (indicates location of file). common, node, etc.
 * @param {String} filename - the source file to copy
 * @param {String} cwd - the directory from which the script should be run
 */
ns.exec = function (type, filename, cwd) {
    var srcPath = path.join(SCRIPTS_DIR, type, filename);
    console.log('running ' + srcPath + '...');
    var process = childProcess.spawn('bash', [srcPath], {cwd: cwd});

    process.stdout.on('data', function (data) {
        sys.print(data);
    });

    process.on('exit', function (code) {
        if (code !== 0) {
            console.log(srcPath + ' failed: ' + code);
        } else {
            console.log(srcPath + ' succeeded.');
        }
    });
};

module.exports = ns;
