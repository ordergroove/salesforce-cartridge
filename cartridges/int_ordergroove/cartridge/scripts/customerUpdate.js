'use strict';

/**
 * Ordergroove Customer Update
 *
 * @module customerUpdate
 *
 * @input Profile : dw.customer.Profile
 * @output Response : dw.system.Status
 *
 */

/* API Includes */
var HookMgr = require('dw/system/HookMgr');

/**
 * Customer Update function calling a hook
 * @param {Object} profile - the customer profile
 * @returns {Object} The hook response
 */
function customerUpdate(profile) {
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        var response = HookMgr.callHook('ordergroove.customer', 'updateCustomer', profile);
        return response;
    }
    return null;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) {
    pdict.Response = customerUpdate(pdict.Profile); //eslint-disable-line
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    sync: customerUpdate,
    execute: execute
};
