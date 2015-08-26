/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

require('./style/main.less');

import $ from 'jquery';
import template from './tmpl/main.jade';

let ns = {
    render: function (element) {
        $(element).append(template({
            content: 'This is my first webpack project!',
        }));
    },
};

window.main = ns;

module.exports = ns;
