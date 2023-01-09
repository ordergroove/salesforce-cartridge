'use strict';

/**
 * Deletes Ordergroove cart auto ship cookie
 *
 * @module cartAutoShipCookie
 *
 *
 */

/* API Includes */
var HookMgr = require('dw/system/HookMgr');

/**
 * Deletes customer cookies function by calling a hook
 */
function deleteCookie() {
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        HookMgr.callHook('ordergroove.customer', 'deleteCookie');
        return;
    }
    return;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) { //eslint-disable-line
    deleteCookie();
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    remove: deleteCookie,
    execute: execute
};
