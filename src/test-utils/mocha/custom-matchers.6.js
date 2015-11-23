require('../../typedefs');

const React = require('react');

module.exports = function (chai) {
    chai.Assertion.addMethod('stubComponent', function (expected) {
        const actual = this._obj;
        const className = React.findDOMNode(actual).className;
        const expectedClassName = `stub ${expected}`;

        try {
            new chai.Assertion(className).to.equal(expectedClassName)
        } catch (err) {
            throw new Error(`Expected component className "${className}" to be "${expectedClassName}"`)
        }
    });
};
