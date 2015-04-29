/**
 * E2E Spec for {@link {{ projectName }}} module
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

var webdriverio = require('webdriverio');
var webdrivercss = require('webdrivercss');
var NORMAL_VIEWPORT_WIDTH = 1280;
var NORMAL_VIEWPORT_HEIGHT = 800;
var SMALL_VIEWPORT_WIDTH = 900;

var testConfig = require('./test-config.json');

describe('{{ projectName }} e2e tests using ' + testConfig.url, function () {

    var client = {};
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

    beforeEach(function () {
        var wdIoOptions = {
            desiredCapabilities: {browserName: testConfig.selenium.browser},
            host: testConfig.selenium.host,
            port: testConfig.selenium.port,
            logLevel: 'silent',
        };
        client = webdriverio.remote(wdIoOptions);
        client.init();
        var wdCssOptions = {
            screenshotRoot: 'spec/e2e/screenshots',
            failedComparisonsRoot: 'spec/e2e/screenshots/diff',
        };
        webdrivercss.init(client, wdCssOptions);
    });

    afterEach(function (done) {
        client.end(done);
    });


    describe('basic demo page', function () {

        it('renders consistently full width', function (done) {
            client
                .url(testConfig.url)
                .localStorage('DELETE')
                .setViewportSize({width: NORMAL_VIEWPORT_WIDTH, height: NORMAL_VIEWPORT_HEIGHT})
                .webdrivercss('demo-normal', [{name: 'body', elem: 'body'}], function (err, res) {
                    expect(err).toBeFalsy();
                    expect(res['body'][0].isWithinMisMatchTolerance).toBeTruthy('screenshots match');
                })
                .call(done);
        });

        it('renders consistently narrow width', function (done) {
            client
                .url(testConfig.url)
                .localStorage('DELETE')
                .setViewportSize({width: SMALL_VIEWPORT_WIDTH, height: NORMAL_VIEWPORT_HEIGHT})
                .webdrivercss('demo-small', [{name: 'body', elem: 'body'}], function (err, res) {
                    expect(err).toBeFalsy();
                    expect(res['body'][0].isWithinMisMatchTolerance).toBeTruthy('screenshots match');
                })
                .call(done);
        });
    });
});
