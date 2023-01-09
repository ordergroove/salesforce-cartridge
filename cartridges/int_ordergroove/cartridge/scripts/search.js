'use strict';

/**
 * Ordergroove PLP/QV Settings
 *
 * @module getSettings
 *
 * @output ProductSettings : String
 *
 */

/**
 * Ordergroove settings function to help render offers
 * @returns {string} The product settings in JSON format
 */
function getOGSettings() {
    var settings = {};
    settings.page_type = '6';
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customerNo = typeof session !== 'undefined' && session.customer !== null && session.customer.profile !== null ? session.customer.profile.customerNo : ''; //eslint-disable-line
    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    settings.logged_in = customer !== null ? customer.isAuthenticated() : false;
    settings.impulse_upsell = true;
    var productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    return productSettings;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) {
    pdict.ProductSettings = getOGSettings(); //eslint-disable-line
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    getSettings: getOGSettings,
    execute: execute
};
