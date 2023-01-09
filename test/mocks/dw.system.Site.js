/**
* Represents the current site mock
*/

var Site = function () {};

Site.prototype.getCurrencyCode = function () {};
Site.prototype.getName = function () {};
Site.prototype.getID = function () {};
Site.getCurrent = function () {
    return new Site();
};
Site.prototype.getPreferences = function () {
    return this.preferences;
};
Site.prototype.getHttpHostName = function () {};
Site.prototype.getHttpsHostName = function () {};
Site.prototype.getCustomPreferenceValue = function (prefName) {
    let customPrefs = this.preferences.custom;
    return customPrefs[prefName];
};
Site.prototype.setCustomPreferenceValue = function () {};
Site.prototype.getDefaultLocale = function () {};
Site.prototype.getAllowedLocales = function () {};
Site.prototype.getAllowedCurrencies = function () {};
Site.prototype.getDefaultCurrency = function () {};
Site.prototype.getTimezone = function () {};
Site.prototype.getTimezoneOffset = function () {};
Site.prototype.isOMSEnabled = function () {};
Site.prototype.currencyCode = null;
Site.prototype.name = null;
Site.prototype.ID = null;
Site.prototype.current = null;
Site.prototype.preferences = {
    custom: {
        OrderGrooveMerchantHashKey: 'OrderGrooveMerchantHashKey'
    }
};
Site.prototype.httpHostName = null;
Site.prototype.httpsHostName = null;
Site.prototype.customPreferenceValue = null;
Site.prototype.defaultLocale = null;
Site.prototype.allowedLocales = null;
Site.prototype.allowedCurrencies = null;
Site.prototype.defaultCurrency = null;
Site.prototype.timezone = null;
Site.prototype.timezoneOffset = null;
Site.prototype.calendar = null;

module.exports = Site;
