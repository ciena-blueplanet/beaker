'use strict';

// Leaving directory node_modules/beaker/config/webpack
require('../../src/test-utils/jasmine');
var req = require.context('../../../../spec/karma', true, /spec$/);

req.keys().forEach(function (module) {
    req(module);
});
