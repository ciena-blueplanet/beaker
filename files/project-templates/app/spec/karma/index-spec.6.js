/**
 * Spec for {@link {{ projectName }}} module
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

/* eslint-disable max-nested-callbacks */

import $ from 'jquery';
import main from '{{ projectName }}';

describe('main', () => {
    let $container;

    beforeEach(() => {
        $container = $('<div/>');
        main.render($container[0]);
    });

    it('renders template', () => {
        expect($('.main p', $container)).toHaveText('This is my first webpack project!');
    });
});
