'use strict';

/**
 * Handles logic related to Ordergroove Payment Methods
 *
 * @module autoShipPaymentMethods
 *
 * @input PaymentMethods : dw.util.ArrayList
 * @input Customer : dw.customer.Customer
 * @output ApplicablePaymentMethods : dw.util.ArrayList
 *
 */

/* API Includes */
var HookMgr = require('dw/system/HookMgr');
var Site = require('dw/system/Site');

/**
 * Set the payment instrument in the context of a transaction with custom attributes
 * and synchronizes subscription payment information with Ordergroove when using
 * payment tokens.
 * @param {Object} customer - the current customer
 * @param {Object} uuid - the customer's payment instrument UUID
 * @param {Object} paymentForm - the payment form
 */
function setPaymentMethod(customer, uuid, paymentForm) {
    customer = 'raw' in customer ? customer.raw : customer; // eslint-disable-line
    var paymentInstruments = customer.getProfile().getWallet().getPaymentInstruments();
    var paymentInstrumentIterator = paymentInstruments.iterator();
    while (paymentInstrumentIterator.hasNext()) {
        var cpi = paymentInstrumentIterator.next();
        if (cpi.getUUID() === uuid) {
            cpi.getCustom().preferred = paymentForm.preferred.value;
            cpi.getCustom().firstName = 'firstName' in paymentForm ? paymentForm.firstName.value : paymentForm.firstname.value;
            cpi.getCustom().lastName = 'lastName' in paymentForm ? paymentForm.lastName.value : paymentForm.lastname.value;
            cpi.getCustom().address1 = paymentForm.address1.value;
            cpi.getCustom().address2 = paymentForm.address2.value;
            cpi.getCustom().city = paymentForm.city.value;
            cpi.getCustom().countryCode = paymentForm.country.value;
            cpi.getCustom().stateCode = 'stateCode' in paymentForm.states ? paymentForm.states.stateCode.value : paymentForm.states.state.value;
            cpi.getCustom().postalCode = 'postalCode' in paymentForm ? paymentForm.postalCode.value : paymentForm.postal.value;
            cpi.getCustom().phone = paymentForm.phone.value;
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') === true) {
                if (cpi.getCustom().preferred === true) {
                    if (HookMgr.hasHook('ordergroove.payment')) {
                        HookMgr.callHook('ordergroove.payment', 'paymentUpdate', customer, cpi);
                    }
                }
            }
            break;
        }
    }
    return;
}

/**
 * Removes invalid customer payment methods by calling a hook
 * @param {Object} methods - the applicable payment methods
 * @param {Object} customer - the current customer
 * @returns {Array} The filtered applicable payment methods
 */
function filterPaymentMethods(methods, customer) {
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        var autoShip = null;
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
            var cookies = request.getHttpHeaders().get('cookie'); // eslint-disable-line
            autoShip = HookMgr.callHook('ordergroove.customer', 'isAutoShip', cookies);
        } else {
            var BasketMgr = require('dw/order/BasketMgr');
            var basket = BasketMgr.getCurrentBasket();
            autoShip = HookMgr.callHook('ordergroove.customer', 'isNewAutoShip', basket);
        }
        if (customer !== null && customer.isAuthenticated() && autoShip === true) { // eslint-disable-line
            var ArrayList = require('dw/util/ArrayList');
            var invalidMethods = new ArrayList();
            // SFRA model compatibility
            methods = methods instanceof ArrayList ? methods : ArrayList(methods); // eslint-disable-line
            var paymentMethodsIter = methods.iterator();
            var PaymentInstrument = require('dw/order/PaymentInstrument');
            while (paymentMethodsIter.hasNext()) {
                var paymentMethod = paymentMethodsIter.next();
                if (paymentMethod.ID !== PaymentInstrument.METHOD_CREDIT_CARD) {
                    invalidMethods.push(paymentMethod);
                }
            }
            methods.removeAll(invalidMethods);
            return methods;
        }
    }
    return methods;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) {
    pdict.ApplicablePaymentMethods = filterPaymentMethods(pdict.PaymentMethods, pdict.Customer); // eslint-disable-line
    return PIPELET_NEXT; // eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    execute: execute,
    // extend: extendPaymentMethods,
    filter: filterPaymentMethods,
    sync: setPaymentMethod
};
