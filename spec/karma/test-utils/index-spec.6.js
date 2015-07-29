/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

const beaker = require('../../../src/test-utils');

describe('test-utils', () => {
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    describe('.e2e.getUrl()', () => {
        let testConfig;

        beforeEach(() => {
            testConfig = {
                http: {
                    entryPoint: 'services',
                    host: 'localhost',
                    port: '80',
                },
            };
        });

        it('returns proper URL', () => {
            expect(beaker.e2e.getUrl(testConfig)).toEqual('http://localhost:80/services');
        });

        it('removes double forward slash from entry point', () => {
            testConfig.http.entryPoint = '/services';
            expect(beaker.e2e.getUrl(testConfig)).toEqual('http://localhost:80/services');
        });

        it('removes double forward slash between entry point and extra', () => {
            testConfig.http.entryPoint = 'services/';
            expect(beaker.e2e.getUrl(testConfig, '/view-service')).toEqual('http://localhost:80/services/view-service');
        });
    });

    describe('.wait()', () => {
        let doneSpy;
        beforeEach(() => {
            doneSpy = jasmine.createSpy('doneSpy');
            beaker.wait(doneSpy, 500);
        });

        it('does not call done yet', () => {
            expect(doneSpy).not.toHaveBeenCalled();
        });

        describe('after timeout passes', () => {
            beforeEach(() => {
                jasmine.clock().tick(500);
            });

            it('calls done', () => {
                expect(doneSpy).toHaveBeenCalled();
            });
        });
    });
});
