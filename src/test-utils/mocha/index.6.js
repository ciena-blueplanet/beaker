/* global beforeEach, chai */

const customMatchers = require('./custom-matchers');

beforeEach(() => {
    chai.use(customMatchers);
});
