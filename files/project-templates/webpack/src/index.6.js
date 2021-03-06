/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

require('./style/main.less');

import $ from 'jquery';
import template from './tmpl/main.jade';

module.exports = {
    render: function (element) {
        $(element).append(template({
            content: 'This is my first webpack project!',
        }));
    },
};
