/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

require('./style/main.less');

let $ = require('jquery');
let template = require('./tmpl/main.jade');

module.exports = {
    render: function (element) {
        $(element).append(template({
            content: 'This is my first webpack project!',
        }));
    }
};
