/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

import _ from 'lodash';
import React from 'react';
import {toDeepEqual, toBeStubComponent, toHaveCorrectPropTypes} from 'beaker/lib/jasmine/custom-matchers';

describe('customMatchers', () => {
    let util, customEqualityTesters, matcher;
    beforeEach(() => {
        util = jasmine.createSpyObj('util', ['equals']);
        customEqualityTesters = ['foo', 'bar'];
        util.equals.and.callFake((actual, expected) => {
            return _.isEqual(actual, expected);
        });
    });

    describe('.toDeepEqual()', () => {
        let actual, expected, result;
        beforeEach(() => {
            matcher = toDeepEqual(util, customEqualityTesters);
            expected = {
                first: 'Tony',
                last: 'Stark',
                alias: 'Iron Man',
                team: 'Avengers',
            };
        });

        describe('when objects are equal', () => {
            beforeEach(() => {
                actual = {
                    first: 'Tony',
                    last: 'Stark',
                    alias: 'Iron Man',
                    team: 'Avengers',
                };

                result = matcher.compare(actual, expected);
            });

            it('calls equality function', () => {
                expect(util.equals).toHaveBeenCalledWith(actual, expected, customEqualityTesters);
            });

            it('returns a passing result', () => {
                expect(result.pass).toBeTruthy();
            });
        });

        describe('when objects are not equal', () => {
            beforeEach(() => {
                actual = {
                    first: 'Tony',
                    last: 'Stark',
                    alias: 'Iron Patriot',
                    team: 'Avengers',
                };

                result = matcher.compare(actual, expected);
            });

            it('calls equality function', () => {
                expect(util.equals).toHaveBeenCalledWith(actual, expected, customEqualityTesters);
            });

            it('returns a failing result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns appropriate error message', () => {
                let error = 'Expected objects to be deeply equal, they are not:\n{\n';
                error += '- "alias": "Iron Patriot",\n';
                error += '+ "alias": "Iron Man",\n';
                error += '  "first": "Tony",\n';
                error += '  "last": "Stark",\n';
                error += '  "team": "Avengers"\n';
                error += '}';

                expect(result.message).toBe(error);
            });
        });
    });

    describe('.toBeStubComponent()', () => {
        let component, result, fakeElement;
        beforeEach(() => {
            fakeElement = {
                className: '',
            };

            component = 'some-react-component';

            spyOn(React, 'findDOMNode').and.callFake(() => {
                return fakeElement;
            });

            matcher = toBeStubComponent(util, customEqualityTesters);
        });

        describe('when classes match', () => {
            beforeEach(() => {
                fakeElement.className = 'stub MyComponent';
                result = matcher.compare(component, 'MyComponent');
            });

            it('looks up the DOM node', () => {
                expect(React.findDOMNode).toHaveBeenCalledWith(component);
            });

            it('returns a positive result', () => {
                expect(result.pass).toBeTruthy();
            });
        });

        describe('when classes do not match', () => {
            beforeEach(() => {
                fakeElement.className = 'stub FooBar';
                result = matcher.compare(component, 'MyComponent');
            });

            it('looks up the DOM node', () => {
                expect(React.findDOMNode).toHaveBeenCalledWith(component);
            });

            it('returns a negative result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns an appropriate error message', () => {
                let error = 'Expected component className "stub FooBar" to be "stub MyComponent"';
                expect(result.message).toBe(error);
            });
        });
    });

    describe('.toHaveCorrectPropTypes()', () => {
        let component, expected, fn, result;

        beforeEach(() => {
            fn = function () {
                return 1;
            };

            component = {
                propTypes: {
                    a: 1,
                    b: 'test',
                    c: fn,
                },
            };

            expected = {
                a: 1,
                b: 'test',
                c: fn,
            };

            matcher = toHaveCorrectPropTypes();
        });

        describe('when no errors', () => {
            beforeEach(() => {
                result = matcher.compare(component, expected);
            });

            it('returns a passing result', () => {
                expect(result.pass).toBeTruthy();
            });
        });

        describe('when unknown property in expected', () => {
            beforeEach(() => {
                expected.d = 'unknown';
                result = matcher.compare(component, expected);
            });

            it('returns a failing result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns appropriate error message', () => {
                const error = 'Unknown key "d" in propTypes';
                expect(result.message).toBe(error);
            });
        });

        describe('when property missing from expected', () => {
            beforeEach(() => {
                delete expected.c;
                result = matcher.compare(component, expected);
            });

            it('returns a failing result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns appropriate error message', () => {
                const error = 'Expected key "c" in propTypes';
                expect(result.message).toBe(error);
            });
        });

        describe('when expected validation does not match actual validation', () => {
            beforeEach(() => {
                expected.c = function () {
                    return 4;
                };
                result = matcher.compare(component, expected);
            });

            it('returns a failing result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns appropriate error message', () => {
                const error = 'Validation for key "c" does not match expected validation';
                expect(result.message).toBe(error);
            });
        });

        describe('when multiple errors', () => {
            beforeEach(() => {
                expected.d = 'unknown';
                delete expected.c;
                result = matcher.compare(component, expected);
            });

            it('returns a failing result', () => {
                expect(result.pass).toBeFalsy();
            });

            it('returns appropriate error message', () => {
                const error = 'Unknown key "d" in propTypes\nExpected key "c" in propTypes';
                expect(result.message).toBe(error);
            });
        });
    });
});
