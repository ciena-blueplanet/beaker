/* global beforeEach, jasmine */

const customMatchers = require('./custom-matchers');

beforeEach(() => {
    chai.use(customMatchers);
});
