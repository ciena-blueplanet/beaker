/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

const rewire = require('rewire');
const $ = require('jquery');
const React = require('react/addons');

describe('stubComponents', () => {
    let stubComponents, revert, rewiredModule, components, stubDeps;

    beforeEach(() => {
        stubComponents = rewire('../../../../src/test-utils/jasmine/stub-components');
        stubDeps = jasmine.createSpy('stubDeps');
        revert = stubComponents.__set__({
            stubDeps,
        });

        rewiredModule = {name: 'my-module'};
    });

    describe('simple components', () => {
        beforeEach(() => {
            components = ['Grid', 'Row', 'Col'];

            stubComponents(rewiredModule, components);
        });

        afterEach(() => {
            revert();
        });

        it('calls stubDeps()', () => {
            expect(stubDeps).toHaveBeenCalledWith(rewiredModule, jasmine.any(Object));
        });

        ['Grid', 'Row', 'Col'].forEach(component => {
            it(`replaces ${component} with a stub`, () => {
                const stubs = stubDeps.calls.argsFor(0)[1];
                expect(stubs[component].displayName).toBe(component);
            });
        });

        describe('when stub is rendered', () => {
            let Grid, component;
            beforeEach(() => {
                Grid = stubDeps.calls.argsFor(0)[1].Grid;
                component = React.addons.TestUtils.renderIntoDocument(
                    <Grid />,
                    document.body
                );
            });

            it('has the appropriate classes', () => {
                expect($(React.findDOMNode(component))).toHaveClass('Grid');
                expect($(React.findDOMNode(component))).toHaveClass('stub');
            });
        });
    });

    describe('complex components', () => {
        let awesomeMethod;

        beforeEach(() => {
            awesomeMethod = jasmine.createSpy('Row.awesomeMethod');
            components = {
                'Grid': {
                    awesomeMethod,
                },
                'Row': {},
                'Col': {},
            };

            stubComponents(rewiredModule, components);
        });

        afterEach(() => {
            revert();
        });

        it('calls stubDeps()', () => {
            expect(stubDeps).toHaveBeenCalledWith(rewiredModule, jasmine.any(Object));
        });

        ['Grid', 'Row', 'Col'].forEach(component => {
            it(`replaces ${component} with a stub`, () => {
                const stubs = stubDeps.calls.argsFor(0)[1];
                expect(stubs[component].displayName).toBe(component);
            });
        });

        describe('when stub is rendered', () => {
            let Grid, component;
            beforeEach(() => {
                Grid = stubDeps.calls.argsFor(0)[1].Grid;
                component = React.addons.TestUtils.renderIntoDocument(
                    <Grid />,
                    document.body
                );
            });

            it('has the appropriate classes', () => {
                expect($(React.findDOMNode(component))).toHaveClass('Grid');
                expect($(React.findDOMNode(component))).toHaveClass('stub');
            });

            it('adds custom methods to stubbed components', () => {
                component.awesomeMethod();
                expect(awesomeMethod).toHaveBeenCalled();
            });
        });
    });
});
