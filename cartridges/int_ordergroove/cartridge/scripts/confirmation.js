'use strict';

/**
 * Ordergroove Confirmation Settings
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
    settings.page_type = '4';
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
