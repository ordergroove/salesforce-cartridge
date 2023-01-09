/* eslint-disable */
'use strict';

/**
 * @module customer.js
 *
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the account section.  This allows OCAPI calls to reference
 * these tools via the OCAPI 'hook' mechanism
 *
 */

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

/**
 * @function updateCustomer
 *
 * Function updates the customer record in OrderGroove
 *
 * @param {object} profile	The customer profile
 */
exports.updateCustomer = function (profile) {
	if (empty(Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable')) || Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') == false) {
		return new Status(Status.OK);
	}
	var log = Logger.getLogger('ordergroove', 'OG');
	if (profile instanceof dw.customer.Profile == false) {
		log.error("Profile parameter passed into hook 'ordergroove.customer' was an invalid type.");
		return new Status(Status.ERROR);
	}
	var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
	var service = LocalServiceRegistry.createService("OrderGroove.CustomerUpdate", {
		createRequest: function(svc, profile) {
			svc.setRequestMethod("PATCH");
			svc.addHeader("Content-Type", "application/json");
			var url = svc.getURL();
			var customerID = profile.getCustomerNo();
			url += "/" + customerID + "/set_contact_details";
			svc.setURL(url);
			var auth = new Object();
			auth["public_id"] = Site.getCurrent().getCustomPreferenceValue("OrderGrooveMerchantID");
			auth["sig_field"] = customerID;
			var HookMgr = require('dw/system/HookMgr');
		    var sig = HookMgr.callHook('ordergroove.encryptor', 'signature', customerID);
			auth["sig"] = sig["signature"];
			auth["ts"] = sig["timestamp"];
			auth = JSON.stringify(auth, null, 5);
			svc.addHeader("Authorization", auth);
			var request = new Object();
			request['merchant'] = Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID');
			request['merchant_user_id'] = customerID;
			request['email'] = profile.getEmail();
			var phone = new String();
			var preferredAddress = profile.getAddressBook().getPreferredAddress();
			if (!empty(profile.getPhoneMobile())) {
				phone = profile.getPhoneMobile();
			} else if (!empty(profile.getPhoneHome())) {
				phone = profile.getPhoneHome();
			} else if (!empty(preferredAddress) && !empty(preferredAddress.getPhone())) {
				phone = preferredAddress.getPhone();
			}
			if (!empty(phone)) {
				request['phone_number'] = phone;
			}
			var payload = JSON.stringify(request, null, 5);
			return payload;
		},
	    parseResponse : function(svc, response) {
	    	return response;
	    },
	    filterLogMessage: function (msg) {
	        return msg;
	    }
	});
	var result = service.call(profile);
	var response = new String();
	if (result.isOk()) {
		response = result.getObject().getText();
	} else {
		response = result.getErrorMessage();
	}
	log.info("\nResponse:\n{0}\n", response);
	return new Status(Status.OK);
};

/**
 * @function deleteCookies
 *
 * Function deletes Ordergroove customer cookies
 *
 */
exports.deleteCookies = function () {
    /* Local API Includes */
    var Cookie = require('dw/web/Cookie');

    var authCookie = new Cookie('og_auth', '');
    authCookie.setSecure(true);
    authCookie.setMaxAge(0); // 0 will delete cookie
    authCookie.setPath('/');
    response.addHttpCookie(authCookie); // response is an implicit variable according to the API
    var impulseCookie = new Cookie('og_impulse', '');
    impulseCookie.setMaxAge(0);
    impulseCookie.setPath('/');
    response.addHttpCookie(impulseCookie);
    return;
};

/**
 * @function deleteCookie
 *
 * Function deletes Ordergroove cart auto ship cookie
 *
 */
exports.deleteCookie = function () {
    /* Local API Includes */
    var Cookie = require('dw/web/Cookie');

    var cartAutoShipCookie = new Cookie('og_cart_autoship', '');
    cartAutoShipCookie.setMaxAge(0); // 0 will delete cookie
    cartAutoShipCookie.setPath('/');
    response.addHttpCookie(cartAutoShipCookie); // response is an implicit variable according to the API
    return;
};

/**
 * Determines if the auto ship cookie is present
 * @param {string} cookies - local instance of request cookies
 * @returns {boolean} a boolean value if the auto ship cookie is present
 */
exports.isAutoShip = function(cookies) {
    if (cookies === null || typeof cookies !== 'string') {
        return false;
    }
    var autoShip = 0;
    var ArrayList = require('dw/util/ArrayList');
    var cookieList = new ArrayList(cookies.split('; ')).iterator();
    var HashMap = require('dw/util/HashMap');
    var cookieMap = new HashMap();
    while (cookieList.hasNext()) {
        var cookie = cookieList.next();
        cookie = cookie.split('=', 2);
        cookieMap.put(cookie[0], cookie[1]);
    }
    if (cookieMap.containsKey('og_autoship') === true) {
        autoShip = Number(cookieMap.get('og_autoship'));
    }
    return Boolean(autoShip);
};

/**
 * Determines if any of the products in the basket have been opted into subscription
 * based on the optin payload on the basket
 * @param {dw.order.Basket} basket - the target Basket object
 * @returns {boolean} a boolean value if the user has opted into a subscription
 */
exports.isNewAutoShip = function(basket) {
    var autoShip = false;
    var optins = basket !== undefined && basket.describe().getCustomAttributeDefinition('subscriptionOptins') !== null && basket.getCustom().subscriptionOptins !== null ? JSON.parse(basket.getCustom().subscriptionOptins) : [];
    optins.forEach(function (subscription) {
        var productID = subscription.product;
        if (basket.getAllProductLineItems(productID).length > 0) {
            autoShip = true;
            return;
        }
    });
    return autoShip;
}
