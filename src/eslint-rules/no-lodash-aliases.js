/**
 * @fileoverview Rule to flag use of lodash (library) aliases
 * @author Nodeca Team <https://github.com/nodeca>
 */

'use strict';

var LODASH_FN_ALIASES = {
    // Array
    head: 'first',
    object: 'zipObject',
    tail: 'rest',
    unique: 'uniq',

    // Collection
    all: 'every',
    any: 'some',
    collect: 'map',
    contains: 'includes',
    detect: 'find',
    each: 'forEach',
    eachRight: 'forEachRight',
    foldl: 'reduce',
    foldr: 'reduceRight',
    include: 'includes',
    inject: 'reduce',
    select: 'filter',

    // Function
    backflow: 'flowRight',
    compose: 'flowRight',

    // Lang
    eq: 'isEqual',

    // Object
    extend: 'assign',
    methods: 'functions',

    // Utility
    iteratee: 'callback',
};

var LODASH_NAMES = ['lodash', '_'];

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        'CallExpression': function detectLodashAlias(node) {

            var callee = node.callee;

            // Check patterns like `_.each(..)`,
            // that should be <Identifier.MemberExpression>

            if (callee.type === 'MemberExpression' && LODASH_FN_ALIASES.hasOwnProperty(callee.property.name)) {

                var parentName = callee.object.name;

                if (callee.object.type === 'Identifier' && LODASH_NAMES.indexOf(parentName) !== -1) {
                    context.report(node, '{{ldh}}.{{alias}}() is alias, use {{ldh}}.{{method}}() instead.', {
                        ldh: parentName,
                        alias: callee.property.name,
                        method: LODASH_FN_ALIASES[callee.property.name],
                    });
                }
            }
        },
    };
};
