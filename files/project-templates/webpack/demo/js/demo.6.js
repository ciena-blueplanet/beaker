/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
*/

'use strict';

// Need to set jQuery on window for Bootstrap
let $ = window.jQuery = require('jquery');

require('../style/demo.less');
require('bootstrap');

let main = require('{{ projectName }}');

$(() => {
    main.render('body');
});
