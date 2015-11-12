/**
 * @fileoverview Rule to flag overriding a previously defined function
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved.
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    var functionAssignments = {};

    return {

        'AssignmentExpression': function (node) {
            if (node.right.type === 'FunctionExpression') {
                var name = context.getSource(node.left);
                if (functionAssignments[name]) {
                    context.report(node, 'Duplicate function "{{name}}".', {name: name});
                } else {
                    functionAssignments[name] = true;
                }
            }
        },
    };
};
