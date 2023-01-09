'use strict';

/**
 * Ordergroove Cart Settings
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
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentOrNewBasket();
    var settings = {};
    settings.page_type = '2';
    var cart = {};
    var products = [];
    var plis = basket.getAllProductLineItems().iterator();
    while (plis.hasNext()) {
        var lineItem = {};
        var pli = plis.next();
        lineItem.id = pli.getProductID();
        lineItem.quantity = pli.getQuantityValue();
        products.push(lineItem);
    }
    cart.products = products;
    settings.cart = cart;
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
