'use strict';

/**
 * Validates Ordergroove Customer
 *
 * @module autoShipCustomer
 *
 * @input Customer : dw.customer.Customer
 *
 */

/* API Includes */
var HookMgr = require('dw/system/HookMgr');

/**
 * Validates customer by calling a hook
 * and redirects if necessary
 * @param {Object} customer - the current customer
 * @param {Object} response - the current response
 */
function validate(customer, response) {
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        var autoShip = null;
        var Site = require('dw/system/Site');
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
            var cookies = request.getHttpHeaders().get('cookie'); //eslint-disable-line
            autoShip = HookMgr.callHook('ordergroove.customer', 'isAutoShip', cookies);
        } else {
            var BasketMgr = require('dw/order/BasketMgr');
            var basket = BasketMgr.getCurrentBasket();
            autoShip = HookMgr.callHook('ordergroove.customer', 'isNewAutoShip', basket);
        }
        if (customer.isAuthenticated() === false && autoShip === true) {
            var URLUtils = require('dw/web/URLUtils');
            response.redirect(URLUtils.https('COCustomer-Start'));
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
    validate(pdict.Customer, response); //eslint-disable-line
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    validate: validate,
    execute: execute
};
