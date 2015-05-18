/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Cyan, Inc. All rightst reserverd.
 */

/* eslint-disable max-nested-callbacks */

'use strict';

const beaker = require('../../src/test-utils');

describe('test-utils', () => {
    beforeEach(() => {
    });

    describe('.wait()', () => {
        it('is defined', () => {
            expect(beaker.wait).toBeDefined();
        });
    });
});
