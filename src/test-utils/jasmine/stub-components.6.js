/**
 * Stub react components
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

'use strict';

const React = require('react');
const stubDeps = require('./stub-deps');

/**
 * Create a stub component
 * @param {String} name - the name of the component
 * @returns {ReactComponent} the stubbed component
 */
function createStubComponent(name) {
    return React.createClass({
        displayName: name,
        render: function () {
            const className = `stub ${name}`;
            return (
                <div className={className}>
                </div>
            );
        },
    });
}

/**
 * Stub out components within the rewired module with simple react components that don't do anything
 * @param {Module} rewiredModule - the module loaded with rewire()
 * @param {String[]} components - the components you want to stub out within rewiredModule
 */
function stubComponents(rewiredModule, components) {
    const stubs = {};
    components.forEach(name => {
        stubs[name] = createStubComponent(name);
    });

    stubDeps(rewiredModule, stubs);
}

module.exports = stubComponents;
