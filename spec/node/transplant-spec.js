/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved
*/

/* eslint-disable max-nested-callbacks */

var transplantModule = require('../../src/transplant');

describe('transplant', function () {
    var reqFunc, t, modulePath;
    beforeEach(function () {
        reqFunc = jasmine.createSpy('reqFunc');
    });

    describe('when specs live in "spec/"', function () {
        beforeEach(function () {
            modulePath = '/path/to/spec/foo/bar';
            t = transplantModule(modulePath, reqFunc);
        });

        it('moves from spec/ tree to src/ tree', function () {
            t.require('./baz');
            expect(reqFunc).toHaveBeenCalledWith('/path/to/src/foo/bar/baz');
        });

        describe('and an invalid modulePath is given', function () {
            beforeEach(function () {
                modulePath = '/path/to/src/foo/bar';
                t = transplantModule(modulePath, reqFunc);
            });

            it('throws an error if used outside spec/ tree', function () {
                var errorMsg = 'Invalid modulePath "/path/to/src/foo/bar" no "spec" dir found!';
                expect(function () {
                    t.require('./baz');
                }).toThrowError(errorMsg);
            });
        });
    });
});
