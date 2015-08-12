/**
 * @author {{ author }}
 * @copyright {{ year }} {{ company }}. All rights reserved.
*/

// Need to set jQuery on window for Bootstrap
import $ from 'jquery';
window.jQuery = $;

require('../style/demo.less');
require('bootstrap');

import main from '{{ projectName }}';

$(() => {
    main.render('body');
});
