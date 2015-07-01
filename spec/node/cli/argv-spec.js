/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
*/

'use strict';

var _ = require('lodash');

var t = require('../../../src/transplant')(__dirname);
var cli = t.require('./index');
var utils = t.require('./utils');

/**
 * Construct an argv object
 * @param {Array} [args] - command-line arguments (including command)
 * @param {Object} [options] - command-line options
 * @returns {Object} an argv object appropriate to pass to a CLI command method
*/
function constructArgv(args, options) {
    return _.assign({
        _: args || [],
    }, options);
}

describe('cli.argv', function () {
    var versionStr;

    beforeEach(function () {
        var packageJSON = t.require('../../package.json');
        versionStr = packageJSON.name + ' v' + packageJSON.version;
        spyOn(console, 'log');
        spyOn(console, 'error');
        spyOn(utils, 'throwCliError');
    });

    it('help command calls cli.help()', function () {
        spyOn(cli, 'help');
        cli.argv(constructArgv(['help']));
        expect(cli.help).toHaveBeenCalledWith({_: ['help']});
    });

    it('help of command calls cli.help() with that command', function () {
        spyOn(cli, 'help');
        cli.argv(constructArgv(['help', 'init']));
        expect(cli.help).toHaveBeenCalledWith({_: ['help', 'init']});
    });

    it('init command calls cli.init()', function () {
        spyOn(cli, 'init');
        cli.argv(constructArgv(['init']));
        expect(cli.init).toHaveBeenCalled();
    });

    it('github command calls cli.github() (and allows --version)', function () {
        spyOn(cli, 'github');
        cli.argv(constructArgv(['github'], {version: '1.0'}));
        expect(cli.github).toHaveBeenCalled();
    });

    it('shows version with -v', function () {
        cli.argv(constructArgv([], {v: true}));
        expect(console.log).toHaveBeenCalledWith(versionStr);
    });

    it('shows version with --version', function () {
        cli.argv(constructArgv([], {version: true}));
        expect(console.log).toHaveBeenCalledWith(versionStr);
    });

    it('defaults to help when no args', function () {
        spyOn(cli, 'help');
        cli.argv(constructArgv());
        expect(cli.help).toHaveBeenCalled();
    });

    it('indicates invalid command', function () {
        cli.argv(constructArgv(['foobar']));
        var errorMsg = 'Invalid command "foobar"';
        expect(utils.throwCliError).toHaveBeenCalledWith(errorMsg, 1);
    });
});
