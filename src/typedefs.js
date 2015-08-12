/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rights reserved.
 */

/**
 * The argv object returned by 'minimist'
 * @external MinimistArgv
 * @see {@link https://github.com/substack/minimist#example}
 */

/**
 * @typedef CliError
 * @property {String} message - the error message
 * @property {Number} exitCode - the exit code for the CLI command
 */

 /**
  * @typedef {Function} AsyncCallback
  * @param {Object} [err] - any error to propogate (or null for no error)
  * @param {Object} [result] - possible result of the current operation
  */

/**
 * @typedef WebdriverioServerTestResults
 * @property {String} output - filename of the tarball with test results
 * @property {String} info - stdout/stderr from test run
 * @property {Number} exitCode - exit code of test run
 */

// ========================================================
// Jasmine Typedefs
// ========================================================

/**
 * @typedef MatchersUtil
 * {@link https://github.com/jasmine/jasmine/blob/master/src/core/matchers/matchersUtil.js}
 */

/**
 * @typedef Matcher
 * @property {Function} compare - the compare function for the matcher
 */

/**
 * @typedef MatcherResult
 * @property {Boolean} pass - true if matcher passes
 * @property {String} message - error message if matcher failed
 */

/**
 * @typedef CustomEqualityTester
 * {@link http://jasmine.github.io/2.0/custom_equality.html}
 */
