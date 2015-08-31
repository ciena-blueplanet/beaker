/**
 * Stub react components
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

import _ from 'lodash';
import React from 'react';
import stubDeps from './stub-deps';

/**
 * Create a stub component
 * @param {String} name - the name of the component
 * @param {Object} props - props to set on React class
 * @returns {ReactComponent} the stubbed component
 */
export function createStubComponent(name, props) {
    return React.createClass(_.assign({
        displayName: name,
        render: function () {
            const className = `stub ${name}`;
            return (
                <div className={className}>
                </div>
            );
        },
    }, props));
}

/**
 * Stub out components within the rewired module with simple react components that don't do anything
 * @param {Module} rewiredModule - the module loaded with rewire()
 * @param {Object|String[]} components - the components you want to stub out within rewiredModule
 */
export default function stubComponents(rewiredModule, components) {
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

    stubDeps(rewiredModule, stubs);
}
