/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

const rewire = require('rewire');

describe('stubDeps()', () => {
    let stubDeps, revert, beforeEachFunc, afterEachFunc;
    let rewiredModule, revertSpy;
    beforeEach(() => {
        beforeEachFunc = null;
        afterEachFunc = null;

        stubDeps = rewire('../../../../src/test-utils/jasmine/stub-deps');
        revert = stubDeps.__set__({
            beforeEach: function (func) {
                beforeEachFunc = func;
            },
            afterEach: function (func) {
                afterEachFunc = func;
            },
        });

        revertSpy = jasmine.createSpy('revertSpy');
        rewiredModule = jasmine.createSpyObj('rewiredModule', ['__set__']);
        rewiredModule.__set__.and.returnValue(revertSpy);

        stubDeps(rewiredModule, {foo: 'bar'});
    });

    afterEach(() => {
        revert();
    });


    it('calls beforeEach', () => {
        expect(beforeEachFunc).not.toBeNull();
    });

    it('calls afterEach', () => {
        expect(beforeEachFunc).not.toBeNull();
    });

    describe('when beforeEachFunc() is called', () => {
        beforeEach(() => {
            beforeEachFunc();
        });

        it('calls .__set__()', () => {
            expect(rewiredModule.__set__).toHaveBeenCalledWith({foo: 'bar'});
        });

        it('does not call revert() yet', () => {
            expect(revertSpy).not.toHaveBeenCalled();
        });

        describe('when afterEachFunc() is called', () => {
            beforeEach(() => {
                afterEachFunc();
            });

            it('calls revert()', () => {
                expect(revertSpy).toHaveBeenCalled();
            });
        });
    });
});
