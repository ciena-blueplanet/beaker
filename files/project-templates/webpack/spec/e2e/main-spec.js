/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

var webdriverio = require('webdriverio');
var webdrivercss = require('webdrivercss');
var utils = require('beaker/src/test-utils').e2e;

var NORMAL_VIEWPORT_WIDTH = 1280;
var NORMAL_VIEWPORT_HEIGHT = 800;
var SMALL_VIEWPORT_WIDTH = 900;

var testConfig = require('./test-config.json');
var url = utils.getUrl(testConfig);

describe('{{ projectName }} e2e tests using ' + url, function () {

    var client;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

    beforeEach(function () {
        client = utils.init(webdriverio, webdrivercss, testConfig);
    });

    afterEach(function (done) {
        client.end(done);
    });

    describe('basic demo page', function () {

        it('renders consistently full width', function (done) {
            client
                .url(url)
                .localStorage('DELETE')
                .setViewportSize({width: NORMAL_VIEWPORT_WIDTH, height: NORMAL_VIEWPORT_HEIGHT})
                .verifyScreenshots('demo-normal', [{name: 'main', elem: 'body'}])
                .call(done);
        });

        it('renders consistently narrow width', function (done) {
            client
                .url(url)
                .localStorage('DELETE')
                .setViewportSize({width: SMALL_VIEWPORT_WIDTH, height: NORMAL_VIEWPORT_HEIGHT})
                .verifyScreenshots('demo-small', [{name: 'main', elem: 'body'}])
                .call(done);
        });
    });
});
