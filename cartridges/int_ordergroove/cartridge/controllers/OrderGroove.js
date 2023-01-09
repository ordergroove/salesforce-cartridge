/* eslint-disable */
'use strict';

/**
 * This controller implements end points for OrderGroove to authenticate the MSI
 * and to place recurring orders.
 *
 * @module controllers/OrderGroove
 */

/* Global API Includes */
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var ISML = require('dw/template/ISML');

exports.Auth = function () {
    if (request.getHttpMethod() !== 'GET') {
		// switching is not possible, set status 403 (forbidden)
        response.setStatus(403);
        return;
    }
    if (request.isHttpSecure() === false) {
        var url = 'https://' + request.httpHost + request.httpPath;
        if (request.httpQueryString !== null) {
            url += '?' + request.httpQueryString;
        }
        response.redirect(url);
        return;
    }

	// Render HMAC authentication
    if (customer.isAuthenticated()) {
        var customerID = customer.getProfile().getCustomerNo();
        if (HookMgr.hasHook('ordergroove.encryptor')) {
            var sig = HookMgr.callHook('ordergroove.encryptor', 'signature', customerID);
            if (typeof sig === 'object') {
                var signature = sig.signature;
                ISML.renderTemplate('printer', {
                    Message: signature
                });
            } else {
                ISML.renderTemplate('printer', {
                    Message: ''
                });
            }
        } else {
            ISML.renderTemplate('printer', {
                Message: ''
            });
        }
    } else {
        ISML.renderTemplate('printer', {
            Message: ''
        });
    }
    return;
};

exports.AuthIframe = function () {
	/* Local API Includes */
    var ArrayList = require('dw/util/ArrayList');
    var Cookie = require('dw/web/Cookie');

    if (request.getHttpMethod() !== 'GET') {
		// switching is not possible, set status 403 (forbidden)
        response.setStatus(403);
        return;
    }
    if (request.isHttpSecure() === false) {
        var url = 'https://' + request.httpHost + request.httpPath;
        if (request.httpQueryString !== null) {
            url += '?' + request.httpQueryString;
        }
        response.redirect(url);
        return;
    }
    if (customer.isAuthenticated()) {
        var customerID = customer.getProfile().getCustomerNo();
        if (HookMgr.hasHook('ordergroove.encryptor')) {
            var auth = HookMgr.callHook('ordergroove.encryptor', 'signature', customerID);
            var	sig = auth.signature;
            var	timestamp = auth.timestamp;
            var contentList = new ArrayList();
            contentList.add1(customerID);
            contentList.add1(timestamp);
            contentList.add1(sig);
            var content = contentList.join('|');
            var cookie = new Cookie('og_auth', content);
            cookie.setSecure(true); // secure cookie
            cookie.setMaxAge(7200); // 2 hour expiration in seconds
            cookie.setPath('/'); // base path
            response.addHttpCookie(cookie);
        }
    }

	// Render authentication page
    ISML.renderTemplate('authentication');
    return;
};

exports.MSI = function () {
    /* Local API Includes */
    var URLUtils = require('dw/web/URLUtils');

    if (request.isHttpSecure() === false) {
        var url = 'https://' + request.httpHost + request.httpPath;
        if (request.httpQueryString !== null) {
            url += '?' + request.httpQueryString;
        }
        response.redirect(url);
        return;
    }
    if (customer.isAuthenticated() === false) {
        response.redirect(URLUtils.https('Account-Show'));
        return;
    }

    // Render MSI page
    ISML.renderTemplate('account/subscriptions/msi');
    return;
};

exports.OrderPlacement = function () {
	/* Local API Includes */
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var AmountDiscount = require('dw/campaign/AmountDiscount');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Site = require('dw/system/Site');
    var HashMap = require('dw/util/HashMap');
    var ShippingLocation = require('dw/order/ShippingLocation');
    var TaxMgr = require('dw/order/TaxMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Money = require('dw/value/Money');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
    var Order = require('dw/order/Order');
    var Status = require('dw/system/Status');

    var log = Logger.getLogger('ordergroove', 'OG');
    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === false) {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'The endpoint is currently disabled.'
        });
        return;
    }
    if (request.isHttpSecure() === false) {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'The HTTP communication is not secure.'
        });
        return;
    }
    if (request.getHttpMethod() !== 'POST') {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'The HTTP method is forbidden.'
        });
        return;
    }

	// Check if required hook exists
    if (HookMgr.hasHook('ordergroove.encryptor') === false) {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'The hook ordergroove.encryptor is not established and is required.'
        });
        return;
    }

	// Retrieve posted query string OrderGroove
    var map = request.getHttpParameterMap();
    var xml = new XML(map.getRequestBodyAsString());
    if (xml.children().length() === 0) {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'The request body was empty or not XML.'
        });
        return;
    }
    var headXML = xml.child('head');
    var customerXML = xml.child('customer');

	// Get customer record
    var customerNo = customerXML.child('customerPartnerId').toString();
    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    if (customer === null) {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '999',
            ErrorMsg: 'Could not obtain a customer record for the provided customer number.'
        });
        return;
    }

	// Verify signature from header
    var headers = request.getHttpHeaders();
    if (headers.containsKey('authorization')) {
        var auth = headers.get('authorization');
        var verified = HookMgr.callHook('ordergroove.encryptor', 'verify', customerNo, auth);
        if (verified === false) {
            ISML.renderTemplate('ErrorXML', {
                ErrorCode: '403',
                ErrorMsg: 'Signature could not be verified to perform a request.'
            });
            return;
        }
    } else {
        ISML.renderTemplate('ErrorXML', {
            ErrorCode: '403',
            ErrorMsg: 'Signature authorization is required.'
        });
        return;
    }

	// Get or create basket
    var basket = BasketMgr.getCurrentOrNewBasket();

	// Gather line items and manually increment quantity for duplicates since pricing gets override
    var itemsXML = xml.child('items');
    var productMap = new HashMap();
    for (var i = Number(0); i < itemsXML.children().length(); i++) {
        var item = itemsXML.children()[i];
        var productKey = item.child('sku').toString();
        if (productMap.containsKey(productKey) === false) {
            var product = {};
            product.sku = productKey;
            product.qty = Number(item.child('qty').toString());
            product.finalPrice = Number(item.child('finalPrice').toString());
            productMap.put(productKey, product);
        } else {
            productMap.get(productKey).qty += Number(item.child('qty').toString());
            productMap.get(productKey).finalPrice += Number(item.child('finalPrice').toString());
        }
    }
    
    // Get any order-level discounts
    var incentivesXML = xml.child('incentives');
    var incentiveID = null;
    var incentiveCode = null;
    for (var i = Number(0); i < incentivesXML.children().length(); i++) {
        var incentiveXML = incentivesXML.children()[i];
        var incentiveTarget = incentiveXML.child('target').toString();
        if (incentiveTarget === 'order') {
            incentiveID = incentiveXML.child('target_id').toString();
            incentiveCode = incentiveXML.child('code').toString();
            break;
        }
    }
    var orderDiscountAmount = new Number(headXML.child('orderSubtotalDiscount').toString());
    

    Transaction.wrap(function () {
		// Set customer number and email for basket
        basket.setCustomerNo(customer.getProfile().getCustomerNo());
        basket.setCustomerEmail(customer.getProfile().getEmail());

		// Get default shipment and create shipping address based on XML
        var shipment = basket.getDefaultShipment();
        var shippingAddress = shipment.createShippingAddress();
        shippingAddress.setCompanyName(customerXML.customerShippingCompany.toString());
        shippingAddress.setFirstName(customerXML.customerShippingFirstName.toString());
        shippingAddress.setLastName(customerXML.customerShippingLastName.toString());
        shippingAddress.setAddress1(customerXML.customerShippingAddress1.toString());
        shippingAddress.setAddress2(customerXML.customerShippingAddress2.toString());
        shippingAddress.setCity(customerXML.customerShippingCity.toString());
        shippingAddress.setPostalCode(customerXML.customerShippingZip.toString());
        shippingAddress.setStateCode(customerXML.customerShippingState.toString());
        shippingAddress.setCountryCode(customerXML.customerShippingCountry.toString().toUpperCase());
        shippingAddress.setPhone(customerXML.customerShippingPhone.toString());

		// Get tax jurisdiction to realize tax rate
        var location = new ShippingLocation(shippingAddress);
        var taxJurisdictionID = TaxMgr.getTaxJurisdictionID(location);
        if (taxJurisdictionID === null) {
            taxJurisdictionID = TaxMgr.getDefaultTaxJurisdictionID();
        }

		// Create product line items and set cost
        var items = productMap.values().toArray();
        items.forEach(function (item) {
            var productID = item.sku;
            var pli = basket.createProductLineItem(productID, shipment);
            var qty = item.qty;
            pli.setQuantityValue(qty);
            var price = item.finalPrice;
            price /= qty;
            pli.setPriceValue(price);
            var productTaxClassID = pli.getTaxClassID();
            if (productTaxClassID === null) {
                productTaxClassID = TaxMgr.getDefaultTaxClassID();
            }
            var taxRate = TaxMgr.getTaxRate(productTaxClassID, taxJurisdictionID);
            pli.updateTax(taxRate);
        });

		// Set shipping method
        var methods = ShippingMgr.getAllShippingMethods().iterator();
        var shipMethodID = Site.getCurrent().getCustomPreferenceValue('OrderGrooveShippingMethod') !== null ? Site.getCurrent().getCustomPreferenceValue('OrderGrooveShippingMethod') : null;
        var customerMethod = null;
        while (methods.hasNext()) {
            var method = methods.next();
            if (method.getID() === shipMethodID) {
                customerMethod = method;
                break;
            }
        }
        shipment.setShippingMethod(customerMethod);

		// Set shipping cost
        var sli = shipment.getStandardShippingLineItem();
        var shippingCost = Number(customerXML.child('orderShipping').toString());
        sli.setPriceValue(shippingCost);
        var shippingTaxClassID = sli.getTaxClassID();
        if (shippingTaxClassID === null) {
            shippingTaxClassID = TaxMgr.getDefaultTaxClassID();
        }
        var taxRate = TaxMgr.getTaxRate(shippingTaxClassID, taxJurisdictionID);
        sli.updateTax(taxRate);

		// Create billing address based on XML
        var billingAddress = basket.createBillingAddress();
        billingAddress.setCompanyName(customerXML.customerBillingCompany.toString());
        billingAddress.setFirstName(customerXML.customerBillingFirstName.toString());
        billingAddress.setLastName(customerXML.customerBillingLastName.toString());
        billingAddress.setAddress1(customerXML.customerBillingAddress1.toString());
        billingAddress.setAddress2(customerXML.customerBillingAddress2.toString());
        billingAddress.setCity(customerXML.customerBillingCity.toString());
        billingAddress.setPostalCode(customerXML.customerBillingZip.toString());
        billingAddress.setStateCode(customerXML.customerBillingState.toString());
        billingAddress.setCountryCode(customerXML.customerBillingCountry.toString().toUpperCase());
        billingAddress.setPhone(customerXML.customerBillingPhone.toString());

		// Pass basket and make external tax service call to override DW tax table.
        if (HookMgr.hasHook('app.basket.calculate.taxify')) {
			// HookMgr.callHook('app.basket.calculate.taxify', 'Taxify', basket);
        }

		// Update totals and do not call calculate hook since it will override prices, promotions, and taxes
        basket.updateTotals();
        
        // Set order-level discount
        var orderTotalAmount = basket.getTotalGrossPrice().getValue();
        if (incentiveID !== null && incentiveCode !== null && orderDiscountAmount !== null) {
            // Do not let order discount amount exceed the order total amount
            if (Math.abs(orderDiscountAmount) > orderTotalAmount) {
                orderDiscountAmount = orderTotalAmount;
            }
            var orderPA = basket.createPriceAdjustment(incentiveID, new AmountDiscount(Math.abs(orderDiscountAmount)));
            orderPA.setPriceValue(-Math.abs(orderDiscountAmount));
            orderPA.updateTax(0);
            if (incentiveCode !== '' && basket.getCouponLineItem(incentiveCode) === null) {
                var cli = basket.createCouponLineItem(incentiveCode);
                cli.associatePriceAdjustment(orderPA);
            }
        }
        
        // Update totals and do not call calculate hook since it will override prices, promotions, and taxes
        basket.updateTotals();

		// Add basket currency, credit card payment instrument, and payment transaction
        basket.removeAllPaymentInstruments();
        var currency = headXML.child('orderCurrency').toString();
        var amount = new Money(basket.getAdjustedMerchandizeTotalPrice().getValue(), currency);
        var opi = basket.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD, amount);
		// Set credit card payment instrument details
        var ccHolderEncrypted = headXML.child('orderCcOwner').toString();
        var ccHolder = HookMgr.callHook('ordergroove.encryptor', 'decipher', ccHolderEncrypted);
        opi.setCreditCardHolder(ccHolder);
        var ccTypeXML = headXML.child('orderCcType').toString().toUpperCase();
        var ccType = HookMgr.callHook('ordergroove.encryptor', 'cardType', ccTypeXML).name
        opi.setCreditCardType(ccType);
        var ccExpEncrypted = headXML.child('orderCcExpire').toString();
        var ccExp = HookMgr.callHook('ordergroove.encryptor', 'decipher', ccExpEncrypted);
        ccExp = ccExp.split('/');
        var ccMonth = Number(ccExp[0]);
        opi.setCreditCardExpirationMonth(ccMonth);
        var ccYear = Number(ccExp[1]);
        opi.setCreditCardExpirationYear(ccYear);
        // Switch between using a token or the encrypted credit card
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') === true) {
            var token = headXML.child('orderTokenId').toString();
            opi.setCreditCardToken(token);
        } else {
            var ccNumberEncrypted = headXML.child('orderCcNumber').toString();
            var ccNumber = HookMgr.callHook('ordergroove.encryptor', 'decipher', ccNumberEncrypted);
            opi.setCreditCardNumber(ccNumber);
        }

		// Verify credit card
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveCardNumber') === true) {
            var paymentCard = PaymentMgr.getPaymentCard(ccType);
            var ccStatus = paymentCard.verify(ccMonth, ccYear, ccNumber);
            if (ccStatus.isError()) {
                if (ccStatus.getMessage() === PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE) {
                    ISML.renderTemplate('ErrorXML', {
                        ErrorCode: '120',
                        ErrorMsg: 'The credit card expiration date provided is not valid.'
                    });
                    return;
                } else if (ccStatus.getMessage() === PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER) {
                    ISML.renderTemplate('ErrorXML', {
                        ErrorCode: '110',
                        ErrorMsg: 'The credit card number provided is not valid.'
                    });
                    return;
                }
            }
        }
        basket.setChannelType(basket.CHANNEL_TYPE_SUBSCRIPTIONS);

        try {
			// Create order
            var order = OrderMgr.createOrder(basket);
        }
        catch (e) {
            log.error(e.toString());
            ISML.renderTemplate('ErrorXML', {
                ErrorCode: '999',
                ErrorMsg: 'A technical error occurred while creating the order.'
            });
            return;
        }

        // Provide a filter for recurring order queries
        if (order.describe().getCustomAttributeDefinition('ordergrooveType') !== null) {
            order.custom.ordergrooveType = 'Ordergroove Subscription Order';
        }
        
		// Tie customer record to the order
        order.setCustomer(customer);

		// Authorize credit card if order amount is more than zero
        if (order.getTotalGrossPrice().getValue() > 0.00) {
            var pil = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator().asList();
            if (pil.isEmpty()) {
                OrderMgr.failOrder(order);
                ISML.renderTemplate('ErrorXML', {
                    ErrorCode: '140',
                    ErrorMsg: 'Missing payment information.'
                });
                return;
            }
            var opi = pil.get(0);
            var paymentTransaction = opi.getPaymentTransaction();
            paymentTransaction.setAmount(order.getTotalGrossPrice());
            var paymentProcessor = PaymentMgr.getPaymentMethod(opi.getPaymentMethod()).getPaymentProcessor();
            var paymentProcessorID = paymentProcessor !== null ? paymentProcessor.getID().toLowerCase() : 'default';
            var paymentProcessorHook = 'app.payment.processor.' + paymentProcessorID;
            var authorizationResult = {};
			// Make external call to authorize credit card
            if (HookMgr.hasHook(paymentProcessorHook)) {
                authorizationResult = HookMgr.callHook(paymentProcessorHook, 'Authorize', order.getOrderNo(), opi, paymentProcessor);
            } else {
                OrderMgr.failOrder(order);
                ISML.renderTemplate('ErrorXML', {
                    ErrorCode: '999',
                    ErrorMsg: 'Payment processor hook is not defined for the given payment method.'
                });
                return;
            }
            if (authorizationResult.not_supported || authorizationResult.error) {
                OrderMgr.failOrder(order);
                ISML.renderTemplate('ErrorXML', {
                    ErrorCode: '140',
                    ErrorMsg: 'Authorization error.'
                });
                return;
            } else if (authorizationResult.declined) {
                OrderMgr.failOrder(order);
                ISML.renderTemplate('ErrorXML', {
                    ErrorCode: '140',
                    ErrorMsg: 'Authorization declined.'
                });
                return;
            }
        }

		// Place order
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            OrderMgr.failOrder(order);
            ISML.renderTemplate('ErrorXML', {
                ErrorCode: '020',
                ErrorMsg: 'Failed to place order.'
            });
            return;
        }
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        order.setExportStatus(Order.EXPORT_STATUS_READY);

		// Render Successful XML response
        ISML.renderTemplate('SuccessXML', {
            OrderNo: order.getOrderNo()
        });
        return;
    });
};

exports.PurchasePostTracking = function () {
    /* Local API Includes */
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');

    if (request.getHttpMethod() !== 'POST') {
		// switching is not possible, set status 403 (forbidden)
        response.setStatus(403);
        return;
    }

    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
        ISML.renderTemplate('printer', {
            Message: 'Legacy offers enabled'
        });
        return;
    }

    var parameters = request.getHttpParameterMap();
    var tracking = parameters.get('tracking');

    var basket = BasketMgr.getCurrentOrNewBasket();
    Transaction.wrap(function () {
        basket.custom.subscriptionOptins = tracking;
    });
    ISML.renderTemplate('printer', {
        Message: basket.custom.subscriptionOptins
    });
    return;
};

/* Web exposed methods */
exports.Auth.public = true;
exports.AuthIframe.public = true;
exports.MSI.public = true;
exports.OrderPlacement.public = true;
exports.PurchasePostTracking.public = true;
