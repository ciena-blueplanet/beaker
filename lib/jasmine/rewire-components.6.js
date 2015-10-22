/**
 * Rewire React components
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

import _ from 'lodash';
import React from 'react';
import {rewireDeps} from './rewire';

// For some reason, eslint doesn't recognize the below displayName
/* eslint-disable react/display-name */

/**
 * Create a stub component
 * @param {String} name - the name of the component
 * @param {Object} props - props to set on React class
 * @returns {ReactComponent} the stubbed component
 */
export function createStubComponent(name, props) {
    return React.createClass(_.assign({
        displayName: name,
        render: () => {
            const className = `stub ${name}`;
            return (
                <div className={className}>
                </div>
            );
        },
    }, props));
}

/**
 * Rewire components within the given module with simple react components that don't do anything
 * @param {Module} module - the module loaded with babel-plugin-rewire
 * @param {Object|String[]} components - the components you want to stub out
 */
export default function rewireComponents(module, components) {
    const stubs = {};

    if (_.isArray(components)) {
        components.forEach(name => {
            stubs[name] = createStubComponent(name, {});
        });
    } else {
        _.forIn(components, (props, name) => {
            stubs[name] = createStubComponent(name, props);
        });
    }

    rewireDeps(module, stubs);
}
