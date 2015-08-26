/**
 * Custom Jasmine matchers
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

require('../../typedefs');

const jsdiff = require('diff');
const React = require('react');

/**
 * Add the diff indicator to the first character of the input (if it's a space) otherwise prepend it
 * @param {String} str - the string to add a diff indicator to
 * @param {Boolean} added - true if added, false if removed
 * @returns {String} the augmented string
 */
function addDiffIndicator(str, added) {
    const modifier = added ? '+' : '-';
    if (str[0] === ' ') {
        return modifier + str.slice(1);
    } else {
        return `${modifier}${str}`;
    }
}

module.exports = {
    /**
     * Deeply compare two JSON objects
     * @param {MatchersUtil} util - the jasmine matcher utilities
     * @param {CustomEqualityTester[]} customEqualityTesters - the user-defined custom equality matchers
     * @returns {Matcher} the actual matcher
     */
    toDeepEqual: function (util, customEqualityTesters) {
        return {
            /**
             * Actually compare the actual value against the expected value
             * @param {Object} actual - obvious
             * @param {Object} expected - obvious
             * @returns {MatcherResult} the result of the comparison
             */
            compare: function (actual, expected) {
                const result = {
                    pass: false,
                    message: '',
                };

                result.pass = util.equals(actual, expected, customEqualityTesters);

                if (!result.pass) {
                    const diffs = jsdiff.diffJson(actual, expected);
                    const messageParts = diffs.map(part => {
                        if (part.added || part.removed) {
                            return addDiffIndicator(part.value, part.added);
                        } else {
                            return part.value;
                        }
                    });
                    result.message = `Expected objects to be deeply equal, they are not:\n${messageParts.join('')}`;
                }

                return result;
            },
        };
    },

    /**
     * Ensure the react component is a stub of the appropriate type
     * @param {MatchersUtil} util - the jasmine matcher utilities
     * @param {CustomEqualityTester[]} customEqualityTesters - the user-defined custom equality matchers
     * @returns {Matcher} the actual matcher
     */
    toBeStubComponent: function (util, customEqualityTesters) {
        return {
            /**
             * Actually compare the actual value against the expected value
             * @param {Object} actual - obvious
             * @param {Object} expected - obvious
             * @returns {MatcherResult} the result of the comparison
             */
            compare: function (actual, expected) {
                const result = {
                    pass: false,
                    message: '',
                };

                const className = React.findDOMNode(actual).className;
                const expectedClassName = `stub ${expected}`;
                result.pass = util.equals(className, expectedClassName, customEqualityTesters);

                if (!result.pass) {
                    result.message = `Expected component className "${className}" ` +
                        `to be "${expectedClassName}"`;
                }

                return result;
            },
        };
    },

    /**
     * Ensure the react component validates propTypes appropriately
     * @returns {Matcher} the actual matcher
     */
    toHaveCorrectPropTypes: function () {
        return {
            /**
             * Actually compare the actual value against the expected value
             * @param {ReactComponent} component - component to validate propTypes of
             * @param {Object} expected - expected propType validations
             * @returns {MatcherResult} the result of the comparison
             */
            compare: function (component, expected) {
                const result = {
                    message: '',
                    pass: false,
                };
                const actual = component.propTypes;
                const errors = [];

                // Make sure each propType has correct validation and make sure test doesn't have extra keys
                Object.keys(expected).forEach(key => {
                    if (key in actual) {
                        if (actual[key] !== expected[key]) {
                            errors.push(`Validation for key "${ key }" does not match expected validation`);
                        }
                    } else {
                        errors.push(`Unknown key "${ key }" in propTypes`);
                    }
                });

                // Make sure test isn't missing any keys from propTypes
                Object.keys(actual).forEach(key => {
                    if (key in expected) {
                        return;
                    }

                    errors.push(`Expected key "${ key }" in propTypes`);
                });

                result.pass = (errors.length === 0);

                if (!result.pass) {
                    result.message = errors.join('\n');
                }

                return result;
            },
        };
    },
};
