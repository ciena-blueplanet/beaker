/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

import _ from 'lodash';
import $ from 'jquery';
import React from 'react/addons';
import rewireComponents, {createStubComponent} from 'beaker/src/test-utils/jasmine/rewire-components';

describe('rewireComponents()', () => {
    let rewireDepsSpy, createStubComponentSpy, rewiredModule;

    beforeEach(() => {
        rewireDepsSpy = jasmine.createSpy('rewireDeps');
        createStubComponentSpy = jasmine.createSpy('createStubComponent').and.callFake((name, props) => {
            return _.assign({name}, props);
        });
        rewireComponents.__Rewire__('rewireDeps', rewireDepsSpy);
        rewireComponents.__Rewire__('createStubComponent', createStubComponentSpy);
        rewiredModule = {name: 'my-module'};
    });

    afterEach(() => {
        rewireComponents.__ResetDependency__('rewireDeps');
        rewireComponents.__ResetDependency__('createStubComponent');
    });

    describe('simple components', () => {
        beforeEach(() => {
            rewireComponents(rewiredModule, ['Foo', 'Bar', 'Baz']);
        });

        it('calls rewireDeps()', () => {
            expect(rewireDepsSpy).toHaveBeenCalledWith(rewiredModule, {
                'Foo': {name: 'Foo'},
                'Bar': {name: 'Bar'},
                'Baz': {name: 'Baz'},
            });
        });
    });

    describe('complex components', () => {
        beforeEach(() => {
            rewireComponents(rewiredModule, {
                'Foo': {foo: 'foo'},
                'Bar': {bar: 'bar'},
                'Baz': {baz: 'baz'},
            });
        });

        it('calls rewireDeps()', () => {
            expect(rewireDepsSpy).toHaveBeenCalledWith(rewiredModule, {
                'Foo': {name: 'Foo', foo: 'foo'},
                'Bar': {name: 'Bar', bar: 'bar'},
                'Baz': {name: 'Baz', baz: 'baz'},
            });
        });
    });
});

describe('createStubComponent()', () => {
    let component, ComponentClass;
    beforeEach(() => {
        ComponentClass = createStubComponent('ComponentClass');
        component = React.addons.TestUtils.renderIntoDocument(
            <ComponentClass />
        );
    });

    it('renders expected DOM', () => {
        expect($(React.findDOMNode(component))).toHaveClass('stub');
        expect($(React.findDOMNode(component))).toHaveClass('ComponentClass');
    });
});
