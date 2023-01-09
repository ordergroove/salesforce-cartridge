'use strict';

/**
 * @module payment.js
 *
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the account section.  This allows OCAPI calls to reference
 * these tools via the OCAPI 'hook' mechanism
 *
 */

var Encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var HookMgr = require('dw/system/HookMgr');
var Status = require('dw/system/Status');
var Result = require('dw/svc/Result');

/**
 * Function updates the payment record in Ordergroove
 * @param {Object} customer  The current customer
 * @param {Object} cpi  The customer payment instrument
 * @returns {Object} The object that contains the response
 */
exports.paymentUpdate = function (customer, cpi) {
    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === false) {
        return new Status(Status.OK);
    }
    var log = Logger.getLogger('ordergroove', 'OG');
    var service = LocalServiceRegistry.createService('Ordergroove.PaymentUpdate', {
        createRequest: function (svc) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            var customerID = customer.profile.customerNo;
            var og = HookMgr.callHook('ordergroove.encryptor', 'signature', customerID);
            var request = {};
            request.merchant_id = Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID');
            var userRequest = {};
            userRequest.user_id = customerID;
            userRequest.ts = og.timestamp;
            userRequest.sig = Encoding.toURI(og.signature);
            request.user = userRequest;
            var paymentRequest = {};
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLabel') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveLabel') === true) {
                paymentRequest.label = cpi.getUUID();
            }
            var ccType = HookMgr.callHook('ordergroove.encryptor', 'cardType', cpi.getCreditCardType()).code;
            paymentRequest.card_type = ccType;
            var ccExp = StringUtils.formatNumber(cpi.getCreditCardExpirationMonth(), '00') + '/' + cpi.getCreditCardExpirationYear();
            var ccExpEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccExp);
            paymentRequest.cc_exp_date = ccExpEncrypted;
            var ccLast4 = cpi.getMaskedCreditCardNumber().replace('*', '', 'g');
            var ccLast4Encrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccLast4);
            paymentRequest.cc_last_4 = ccLast4Encrypted;
            var ccHolder = cpi.getCreditCardHolder();
            var ccHolderEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccHolder);
            paymentRequest.cc_holder = ccHolderEncrypted;
            paymentRequest.token_id = cpi.getCreditCardToken();
            var billingRequest = {};
            billingRequest.first_name = cpi.describe().getCustomAttributeDefinition('firstName') !== null ? cpi.getCustom().firstName : '';
            billingRequest.last_name = cpi.describe().getCustomAttributeDefinition('lastName') !== null ? cpi.getCustom().lastName : '';
            billingRequest.phone = cpi.describe().getCustomAttributeDefinition('phone') !== null ? cpi.getCustom().phone : '';
            billingRequest.address = cpi.describe().getCustomAttributeDefinition('address1') !== null ? cpi.getCustom().address1 : '';
            billingRequest.address2 = cpi.describe().getCustomAttributeDefinition('address2') !== null && cpi.getCustom().address2 !== null ? cpi.getCustom().address2 : '';
            billingRequest.city = cpi.describe().getCustomAttributeDefinition('city') !== null ? cpi.getCustom().city : '';
            billingRequest.country_code = cpi.describe().getCustomAttributeDefinition('countryCode') !== null ? cpi.getCustom().countryCode : '';
            billingRequest.zip_postal_code = cpi.describe().getCustomAttributeDefinition('postalCode') !== null ? cpi.getCustom().postalCode : '';
            billingRequest.state_province_code = cpi.describe().getCustomAttributeDefinition('stateCode') !== null ? cpi.getCustom().stateCode : '';
            paymentRequest.billing = billingRequest;
            request.payment = paymentRequest;
            var payload = 'update_request=' + JSON.stringify(request, null, 4);
            log.info('Request: {0}', payload);
            return payload;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    var result = service.call(cpi);
    var response = null;
    if (result.getStatus() === Result.OK) {
        response = result.getObject().getText();
    } else {
        response = result.getErrorMessage();
    }
    log.info('\nResponse:\n{0}\n', response);
    return new Status(Status.OK);
};
