'use strict';

// Leaving directory node_modules/beaker/config/webpack
var req = require.context('../../../../spec/karma', true, /spec$/);

req.keys().forEach(function (module) {
    req(module);
});
