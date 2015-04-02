/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
 */

'use strict';

require('./style/main.less');

let template = require('./tmpl/main.jade');
let $ = require('jquery');

let ns = {
    render: function (element) {
        $(element).append(template({
            content: 'This is my first webpack project!'
        }));
    }
};

window.main = ns;

module.exports = ns;
