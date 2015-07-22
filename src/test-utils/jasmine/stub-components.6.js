/**
 * Stub react components
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

const _ = require('lodash');
const React = require('react');
const stubDeps = require('./stub-deps');

/**
 * Create a stub component
 * @param {String} name - the name of the component
 * @param {Object} props - props to set on React class
 * @returns {ReactComponent} the stubbed component
 */
function createStubComponent(name, props) {
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
function stubComponents(rewiredModule, components) {
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

module.exports = stubComponents;
