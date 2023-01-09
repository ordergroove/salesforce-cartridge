'use strict';

/**
 * Ordergroove Product Settings
 *
 * @module getSettings
 *
 * @input Product : dw.catalog.Product
 * @output ProductSettings : String
 *
 */

/**
 * Ordergroove settings function to help render offers
 * @param {Object} product - the product object
 * @returns {string} The product settings in JSON format
 */
function getOGSettings(product) {
    var pid = typeof product.object.ID !== 'undefined' ? product.object.ID : product.getID(); //eslint-disable-line
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(pid); //eslint-disable-line
    var settings = {};
    if (product !== null) {
        settings.page_type = '1';
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customerNo = typeof session !== 'undefined' && session.customer !== null && session.customer.profile !== null ? session.customer.profile.customerNo : ''; //eslint-disable-line
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
        settings.logged_in = customer !== null ? customer.isAuthenticated() : false;
        settings.impulse_upsell = true;
    }
    var productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    return productSettings;
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) {
    pdict.ProductSettings = getOGSettings(pdict.Product); //eslint-disable-line
    return PIPELET_NEXT; //eslint-disable-line
}

/* Module export for controllers */
module.exports = {
    getSettings: getOGSettings,
    execute: execute
};
