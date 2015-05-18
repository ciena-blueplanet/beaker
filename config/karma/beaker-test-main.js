'use strict';

// Leaving directory config/webpack
var req = require.context('../../spec/karma', true, /spec$/);

req.keys().forEach(function (module) {
    req(module);
});
