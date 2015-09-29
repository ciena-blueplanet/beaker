/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
*/

'use strict';

// Leaving directory config/webpack
const req = require.context('../../spec/karma', true, /spec$/);

req.keys().forEach((module) => {
    req(module);
});
