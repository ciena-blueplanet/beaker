/**
 * @fileoverview Rule to flag overriding a previously defined function
 * @author Adam Meadows
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    'use strict';

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
