/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
*/

'use strict';

// Need to set jQuery on window for Bootstrap
import $ from 'jquery';
window.jQuery = $;

require('../style/demo.less');
require('bootstrap');

import main from '{{ projectName }}';

$(() => {
    main.render('body');
});
