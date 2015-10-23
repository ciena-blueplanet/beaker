/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
*/

/* eslint-disable max-nested-callbacks */

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const transplantModule = require('../../src/transplant');

describe('transplant', () => {
    let reqFunc, t, modulePath;
    beforeEach(() => {
        reqFunc = jasmine.createSpy('reqFunc');
    });

    describe('when specs live in "spec/"', () => {
        beforeEach(() => {
            modulePath = '/path/to/spec/foo/bar';
            t = transplantModule(modulePath, reqFunc);
        });

        it('moves from spec/ tree to src/ tree', () => {
            t.require('./baz');
            expect(reqFunc).toHaveBeenCalledWith('/path/to/src/foo/bar/baz');
        });

        describe('and an invalid modulePath is given', () => {
            beforeEach(() => {
                modulePath = '/path/to/src/foo/bar';
                t = transplantModule(modulePath, reqFunc);
            });

            it('throws an error if used outside spec/ tree', () => {
                const errorMsg = 'Invalid modulePath "/path/to/src/foo/bar" no "spec" dir found!';
                expect(() => {
                    t.require('./baz');
                }).toThrowError(errorMsg);
            });
        });
    });
});
