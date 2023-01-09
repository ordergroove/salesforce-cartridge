'use strict';

/**
 * Deletes Ordergroove Customer Cookies
 *
 * @module customerCookies
 *
 *
 */


/**
 * Deletes customer cookies function by calling a hook
 */
function deleteCookies() {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === true) {
        var HookMgr = require('dw/system/HookMgr');
        if (HookMgr.hasHook('ordergroove.customer') === true) {
            HookMgr.callHook('ordergroove.customer', 'deleteCookies');
            return;
        }
    }
    return;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) { //eslint-disable-line
    deleteCookies();
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    remove: deleteCookies,
    execute: execute
};
