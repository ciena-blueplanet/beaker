/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

const beaker = require('../../src/test-utils');

describe('test-utils', () => {
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
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
