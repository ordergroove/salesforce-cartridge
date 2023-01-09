'use strict';

/**
 * OrderGroove Purchase Post
 * Can be used with, without and at the same time as OrderGroove’s cart tracking system.
 * POST must be made to OrderGroove with every purchase/checkout regardless of whether or not a subscription is to be created.
 * If subscription information is being sent, payment becomes a required object in the payload.
 *
 * @module purchasePost
 *
 * @input OrderNo : String
 * @output Response : dw.svc.Result
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');
var HookMgr = require('dw/system/HookMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Mail = require('dw/net/Mail');
var ArrayList = require('dw/util/ArrayList');
var System = require('dw/system/System');
var Status = require('dw/system/Status');

/**
 * Purchase Post main function logic
 * @param {Object} orderNo - the order number
 * @param {boolean} retry - a flag parameter to indicate a retry
 * @returns {Object} The response
 */
function purchasePost(orderNo, retry) {
	// Create the service
    var service = LocalServiceRegistry.createService('OrderGroove.CreateSubscription', {
        createRequest: function (svc, order) {
			// HTTPS POST protocol with headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            var auth = {};
            auth.public_id = Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID');
			// Order preferences in BM allow a customer number for guest orders
            var customerID = order.getCustomerNo();
            auth.sig_field = customerID;
            var sig = HookMgr.callHook('ordergroove.encryptor', 'signature', customerID);
            auth.sig = sig.signature;
            auth.ts = sig.timestamp;
            auth = JSON.stringify(auth);
            svc.addHeader('Authorization', auth);

			// Merchant Info
            var purchaseRequest = {};
            purchaseRequest.merchant_id = Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID');

            var orderRetry = CustomObjectMgr.getCustomObject('PurchasePostRetry', order.getOrderNo());
			// Custom site preference switch for Ordergroove Session ID
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveSession') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveSession') === true) {
                if (retry === true) {
                    if (orderRetry !== null) {
                        purchaseRequest.session_id = encodeURIComponent(orderRetry.getCustom().sessionID);
                    }
                } else {
                    // Set sessionID
                    var cookies = request.getHttpCookies(); //eslint-disable-line
                    var sessionID = '';
                    for (var i = 0; i < cookies.getCookieCount(); i++) {
                        var cookie = cookies[i];
                        var cookieName = cookie.getName();
                        if (cookieName === 'og_session_id') {
                            sessionID = cookie.getValue();
                            break;
                        }
                    }
                    purchaseRequest.session_id = sessionID !== null ? encodeURIComponent(sessionID) : '';
                }
            }
            purchaseRequest.merchant_order_id = encodeURIComponent(order.getOrderNo());

			// User Object
            var user = {};
			// Order preferences in BM allow a customer number for guest orders
            user.user_id = encodeURIComponent(order.getCustomerNo());
            var profile = order.getCustomer().getProfile();
			// Guest orders will not have a profile
            if (profile !== null) {
                user.first_name = encodeURIComponent(profile.getFirstName());
                user.last_name = encodeURIComponent(profile.getLastName());
                user.email = encodeURIComponent(profile.getEmail());
            } else {
                user.first_name = encodeURIComponent(order.getBillingAddress().getFirstName());
                user.last_name = encodeURIComponent(order.getBillingAddress().getLastName());
                user.email = encodeURIComponent(order.getCustomerEmail());
            }
            var userData = {};
			// Client-specific data fields (if necessary)
			// userData.key = 'value';
            user.extra_data = userData;

			// Shipping Address Object switch via custom site preference
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveShipping') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveShipping') === true) {
                var shipAddress = {};
                var shippingAddress = order.getDefaultShipment().getShippingAddress();
                shipAddress.first_name = encodeURIComponent(shippingAddress.getFirstName());
                shipAddress.last_name = encodeURIComponent(shippingAddress.getLastName());
                if (shippingAddress.getCompanyName() !== null) {
                    shipAddress.company_name = encodeURIComponent(shippingAddress.getCompanyName());
                }
                shipAddress.address = encodeURIComponent(shippingAddress.getAddress1());
                if (shippingAddress.getAddress2() !== null) {
                    shipAddress.address2 = encodeURIComponent(shippingAddress.getAddress2());
                }
                shipAddress.city = encodeURIComponent(shippingAddress.getCity());
                shipAddress.state_province_code = encodeURIComponent(shippingAddress.getStateCode());
                shipAddress.zip_postal_code = encodeURIComponent(shippingAddress.getPostalCode());
                shipAddress.phone = encodeURIComponent(shippingAddress.getPhone());
                // shipAddress.fax = '';
                shipAddress.country_code = encodeURIComponent(shippingAddress.getCountryCode().getValue().toString().toUpperCase());
                user.shipping_address = shipAddress;
            }

			// Billing Address Object switch via custom site preference
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveBilling') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveBilling') === true) {
                var billAddress = {};
                var billingAddress = order.getBillingAddress();
                billAddress.first_name = encodeURIComponent(billingAddress.getFirstName());
                billAddress.last_name = encodeURIComponent(billingAddress.getLastName());
                if (billingAddress.getCompanyName() !== null) {
                    billAddress.company_name = encodeURIComponent(billingAddress.getCompanyName());
                }
                billAddress.address = encodeURIComponent(billingAddress.getAddress1());
                if (billingAddress.getAddress2() !== null) {
                    billAddress.address2 = encodeURIComponent(billingAddress.getAddress2());
                }
                billAddress.city = encodeURIComponent(billingAddress.getCity());
                billAddress.state_province_code = encodeURIComponent(billingAddress.getStateCode());
                billAddress.zip_postal_code = encodeURIComponent(billingAddress.getPostalCode());
                billAddress.phone = encodeURIComponent(billingAddress.getPhone());
                // billAddress.fax = '';
                billAddress.country_code = encodeURIComponent(billingAddress.getCountryCode().getValue().toString().toUpperCase());
                user.billing_address = billAddress;
            }
            purchaseRequest.user = user;

			// Payment Object
            var payment = {};
            var pil = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator().asList();
            var opi = pil.get(0);
			// the UUID could be used to match a payment instrument in the customer's wallet
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLabel') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveLabel') === true) {
                payment.label = encodeURIComponent(opi.getUUID());
            }
			// Custom site preference switch to use a payment token
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') === true) {
                payment.token_id = encodeURIComponent(opi.getCreditCardToken());
            }
			// Custom site preference switch to send credit card holder
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardHolder') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardHolder') === true) {
                var ccHolder = opi.getCreditCardHolder();
                var ccHolderEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccHolder);
                payment.cc_holder = ccHolderEncrypted;
            }
			// Custom site preference switch to send credit card number
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') === true) {
                if (retry === true) {
                    if (orderRetry !== null) {
                        payment.cc_number = orderRetry.getCustom().encryptedCardNumber;
                    }
                } else {
                    var ccNumber = customer.isAuthenticated() ? opi.getCreditCardNumber() : session.getForms().billing.paymentMethods.creditCard.number.value; //eslint-disable-line
                    var ccNumberEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccNumber);
                    payment.cc_number = ccNumberEncrypted;
                }
            }
			// Custom site preference switch to send credit card type
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardType') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardType') === true) {
                var ccType = HookMgr.callHook('ordergroove.encryptor', 'cardType', opi.getCreditCardType()).code;
                payment.cc_type = ccType; // no encoding since this is not a string type
            }
			// Custom site preference switch to send credit card expiration
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardExpiration') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardExpiration') === true) {
                var ccExp = StringUtils.formatNumber(opi.getCreditCardExpirationMonth(), '00') + '/' + opi.getCreditCardExpirationYear();
                var ccExpEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccExp);
                payment.cc_exp_date = ccExpEncrypted;
            }
            purchaseRequest.payment = payment;

			// Products Object
            var products = [];
            var count = Number(0);
            var plis = order.getAllProductLineItems().iterator();
            while (plis.hasNext()) {
				// Product Object
                var product = {};
                var pli = plis.next();
                product.product = encodeURIComponent(pli.getProductID());
                product.sku = encodeURIComponent(pli.getProductID());

                if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
					// Subscription Info Object
                    var subscription = {};
					// Custom site preference switch to send subscription data
                    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveSubscription') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveSubscription') === true) {
                        subscription.components = '';
                        subscription.price = encodeURIComponent(Number(pli.getProratedPrice().getValue() / pli.getQuantityValue()).toFixed(2));
                        subscription.quantity = pli.getQuantityValue(); // no encoding since this is not a string type
                        var subscribeData = {};
						// Client-specific data fields (if necessary)
						// subscribeData.key = 'store';
                        subscription.extra_data = subscribeData;
                    }

					// Tracking Override Object
                    var trackingData = {};
					// Custom site preference switch to send tracking override
                    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveTracking') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveTracking') === true) {
                        trackingData.offer = Site.getCurrent().getCustomPreferenceValue('OrderGrooveOfferID') !== null ? encodeURIComponent(Site.getCurrent().getCustomPreferenceValue('OrderGrooveOfferID')) : '';
                        trackingData.every = '';
                        trackingData.every_period = '';
                    }
                    subscription.tracking_override = trackingData;
                    product.subscription_info = subscription;
                }

				// Purchase Info Object
                var purchaseData = {};
                var unitPrice = Number(pli.getProratedPrice().getValue() / pli.getQuantityValue());
                purchaseData.quantity = pli.getQuantityValue(); // no encoding since this is not a string type
                var discountPrice = Number(0);
                var pap = pli.getProratedPriceAdjustmentPrices().values().iterator();
                while (pap.hasNext()) {
                    var adjustment = pap.next();
                    discountPrice += adjustment.getValue();
                }
                discountPrice = Math.abs(discountPrice) / pli.getQuantityValue();
                var beforeDiscountPrice = unitPrice + discountPrice;
                purchaseData.price = encodeURIComponent(beforeDiscountPrice.toFixed(2));
                purchaseData.discounted_price = encodeURIComponent(unitPrice.toFixed(2));
                purchaseData.total = encodeURIComponent(pli.getProratedPrice().getValue().toFixed(2));
                product.purchase_info = purchaseData;

				// Store and handle next product line item
                products[count] = product;
                count++;
            }
            purchaseRequest.products = products;

            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === false) {
                if (retry === true) {
                    var retryOrder = CustomObjectMgr.getCustomObject('PurchasePostRetry', order.getOrderNo());
                    if (retryOrder !== null) {
                        purchaseRequest.tracking = JSON.parse(retryOrder.getCustom().subscriptionOptins);
                    }
                } else {
                    purchaseRequest.tracking = JSON.parse(order.custom.subscriptionOptins);
                }
                purchaseRequest.og_cart_tracking = false;
            }

			// Convert payload from OOP to JSON
            var payload = 'create_request=' + JSON.stringify(purchaseRequest, null, 5);
            return payload;
        },
        // Mock function expects an object with particular properties but it is not documented in the API
        mockCall: function () {
            var response = {};
            response.statusCode = 201;
            response.statusMessage = 'Success';
            return response;
        },
        // Parse function only called for a status code in the 200s
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    try {
		// Main Entry Point
        var log = Logger.getLogger('ordergroove', 'OG');
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === false) {
            return; // fast track to finally statement
        }
        if (HookMgr.hasHook('ordergroove.encryptor') === false) {
            log.error('The hook ordergroove.encryptor is not established and is required.');
            return;
        }
        var order = OrderMgr.getOrder(orderNo);

        // Provide a filter for initial order queries
        if (order.describe().getCustomAttributeDefinition('ordergrooveType') !== null) {
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
                if (HookMgr.hasHook('ordergroove.customer') === true) {
                    var cookies = request.getHttpHeaders().get('cookie'); //eslint-disable-line
                    var autoShip = HookMgr.callHook('ordergroove.customer', 'isAutoShip', cookies);
                    if (autoShip === true) {
                        Transaction.wrap(function () {
                            order.custom.ordergrooveType = 'Ordergroove Trigger Order';
                        });
                    }
                }
            } else {
                var hasSubscriptions = JSON.parse(order.custom.subscriptionOptins).length > 0;
                if (hasSubscriptions === true) {
                    Transaction.wrap(function () {
                        order.custom.ordergrooveType = 'Ordergroove Trigger Order';
                    });
                }
            }
        }

        retry = ((retry !== null) && (typeof retry !== 'undefined')) ? retry : false; //eslint-disable-line
		// Invoke the service call
        var response = service.call(order, retry);
		// Make sure custom object exists or it will throw exception
        var retryTypeDef = CustomObjectMgr.describe('PurchasePostRetry');

        if (response !== null) {
            if (response.isOk() === false) {
                // Retry Logic
                if (retryTypeDef !== null) {
                    // Check if this order number exists in queue
                    var retryOrder = CustomObjectMgr.getCustomObject('PurchasePostRetry', order.getOrderNo());
                    if (retryOrder === null) {
                        // Place order in queue for retry since it failed initially
                        Transaction.wrap(function () {
                            retryOrder = CustomObjectMgr.createCustomObject('PurchasePostRetry', order.getOrderNo());
                            // Check if card number should be sent
                            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') === true
                                && retryTypeDef.getCustomAttributeDefinition('encryptedCardNumber') !== null) {
                                // Getting decrypted credit card number will not be possible during job run (and depending on retention settings in BM) so we store it for later
                                var pil = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator().asList();
                                var opi = pil.get(0);
                                var ccNumber = customer.isAuthenticated() ? opi.getCreditCardNumber() : session.getForms().billing.paymentMethods.creditCard.number.value;  //eslint-disable-line
                                var ccNumberEncrypted = HookMgr.callHook('ordergroove.encryptor', 'cipher', ccNumber);
                                // Only when initially creating object should the card number be set.  Updating it during retry would not be possible
                                retryOrder.getCustom().encryptedCardNumber = ccNumberEncrypted;
                            }
                            // Check if Session ID should be sent so we can store it for retry later
                            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveSession') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveSession') === true
                                && retryTypeDef.getCustomAttributeDefinition('sessionID') !== null) {
                                var cookies = request.getHttpCookies(); //eslint-disable-line
                                var sessionID = '';
                                for (var i = 0; i < cookies.getCookieCount(); i++) {
                                    var cookie = cookies[i];
                                    var cookieName = cookie.getName();
                                    if (cookieName === 'og_session_id') {
                                        sessionID = cookie.getValue();
                                        break;
                                    }
                                }
                                if (sessionID !== null) {
                                    retryOrder.getCustom().sessionID = sessionID; // this will be encoded during the retry process
                                }
                            }
                            // Check if subscriptionOptins should be sent so we can store it for retry later
                            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === false
                                && retryTypeDef.getCustomAttributeDefinition('subscriptionOptins') !== null) {
                                retryOrder.getCustom().subscriptionOptins = order.custom.subscriptionOptins;
                            }
                        });
                    }
                }
            }
            // Custom site preference switch to send email notifications
            var code = response.getError();
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEmail') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveEmail') === true) {
                // Do not send mail for retry attempts
                if (!retry) {
                    // Send mail only on specific HTTPS codes per Ordergroove specification
                    if (code === 207 || code === 400 || code === 401) {
                        // Send Mail
                        var template = new Template('mail/purchasePostError');
                        var map = new HashMap();
                        map.put('orderNo', order.getOrderNo());
                        map.put('status', response.getStatus());
                        map.put('msg', response.getMsg());
                        // Pretty print JSON for email
                        var oMessage = JSON.parse(response.getErrorMessage());
                        var errorMessage = JSON.stringify(oMessage, null, 4);
                        map.put('errorMessage', errorMessage);
                        var content = template.render(map);
                        var mail = new Mail();
                        mail.setFrom('no-reply@ordergroove.com');
                        var addresses = '';
                        var addressList = new ArrayList(Site.getCurrent().getCustomPreferenceValue('OrderGrooveAddresses'));
                        if (addressList.isEmpty() === false) {
                            addresses = addressList.join();
                        }
                        mail.addTo(addresses);
                        if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
                            mail.setSubject('Ordergroove Production Notification');
                        } else {
                            mail.setSubject('Ordergroove Test Notification');
                        }
                        mail.setContent(content);
                        // Mail may not have been sent when this method returns
                        var mailStatus = mail.send();
                        map.put('mailStatus', mailStatus);
                    }
                }
            }
        }
        return response; //eslint-disable-line
    } catch (e) {
        Logger.getLogger('ordergroove', 'OG').error(e.toString());
    }
}

/**
 * Reserved function for pipeline compatibility
 * @param {Object} pdict - the pipeline dictionary
 * @returns {Object} The next pipelet
 */
function execute(pdict) {
    pdict.Response = purchasePost(pdict.OrderNo); //eslint-disable-line
    return PIPELET_NEXT; //eslint-disable-line
}

/**
 * Job process function
 * @returns {Object} The status
 */
function processRetries() {
    try {
		// Make sure custom object exists or it will throw exception
        var retryTypeDef = CustomObjectMgr.describe('PurchasePostRetry');
        if (retryTypeDef !== null) {
            var retryIter = CustomObjectMgr.getAllCustomObjects('PurchasePostRetry');
            if (retryIter.getCount() === 0) {
                retryIter.close();
                return new Status(Status.OK, 'ORDERS_NOT_FOUND', 'There are no orders for retry.');
            }
            if (retryTypeDef.getCustomAttributeDefinition('orderNo') === null) {
                retryIter.close();
                return new Status(Status.ERROR, 'MISSING_CUSTOM_OBJECT_ATTRIBUTE', 'The custom object PurchasePostRetry with the attribute orderNo was not found.');
            }
            while (retryIter.hasNext()) {
                var retry = retryIter.next();
                var orderNo = retry.getCustom().orderNo;
                var response = purchasePost(orderNo, true);
                // Remove object from the retry queue when successful, otherwise let internal retention setting handle it
                if (response !== null && response.isOk()) {
                    // Transaction wrap just in case the script module is not marked as a transaction in job schedule step configurator
                    Transaction.wrap(function () {  //eslint-disable-line
                        CustomObjectMgr.remove(retry);
                    });
                }
            }
            retryIter.close();
        }
    } catch (e) {
        Logger.getLogger('ordergroove', 'OG').error(e.toString());
        return new Status(Status.ERROR, 'MISSING_CUSTOM_OBJECT', 'The custom object PurchasePostRetry was not found.');
    }
    return new Status(Status.OK);
}

/* Module exports for controllers and jobs */
module.exports = {
    orderNo: purchasePost,
    execute: execute,
    retryPurchasePost: processRetries
};
