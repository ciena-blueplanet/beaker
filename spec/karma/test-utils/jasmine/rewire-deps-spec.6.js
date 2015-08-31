/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

import {rewireDeps, resetDeps} from 'beaker/src/test-utils/jasmine/rewire';

describe('rewireDeps()', () => {
    let module;
    beforeEach(() => {
        module = jasmine.createSpyObj('module', ['__Rewire__']);
        rewireDeps(module, {
            Foo: {displayName: 'Foo'},
            Bar: {displayName: 'Bar'},
            Baz: {displayName: 'Baz'},
        });
    });

    ['Foo', 'Bar', 'Baz'].forEach(prop => {
        it(`rewires ${prop}`, () => {
            expect(module.__Rewire__).toHaveBeenCalledWith(prop, {displayName: prop});
        });
    });
});

describe('resetDeps()', () => {
    let module;
    beforeEach(() => {
        module = jasmine.createSpyObj('module', ['__ResetDependency__']);
        resetDeps(module, {
            Foo: {displayName: 'Foo'},
            Bar: {displayName: 'Bar'},
            Baz: {displayName: 'Baz'},
        });
    });

    describe('when given an array', () => {
        beforeEach(() => {
            resetDeps(module, ['Foo', 'Bar', 'Baz']);
        });

        ['Foo', 'Bar', 'Baz'].forEach(prop => {
            it(`resets ${prop}`, () => {
                expect(module.__ResetDependency__).toHaveBeenCalledWith(prop);
            });
        });
    });

    describe('when given an object', () => {
        beforeEach(() => {
            resetDeps(module, {
                Foo: {displayName: 'Foo'},
                Bar: {displayName: 'Bar'},
                Baz: {displayName: 'Baz'},
            });
        });

        ['Foo', 'Bar', 'Baz'].forEach(prop => {
            it(`resets ${prop}`, () => {
                expect(module.__ResetDependency__).toHaveBeenCalledWith(prop);
            });
        });
    });
});
