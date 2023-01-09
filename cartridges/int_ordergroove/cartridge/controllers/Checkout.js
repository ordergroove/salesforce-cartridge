'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Login', function (req, res, next) {
    var viewData = res.getViewData();
    var autoShip = false;
    var HookMgr = require('dw/system/HookMgr');
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        var Site = require('dw/system/Site');
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === true) {
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
                var cookies = req.httpHeaders.cookie;
                autoShip = HookMgr.callHook('ordergroove.customer', 'isAutoShip', cookies);
            } else {
                var BasketMgr = require('dw/order/BasketMgr');
                var basket = BasketMgr.getCurrentBasket();
                autoShip = HookMgr.callHook('ordergroove.customer', 'isNewAutoShip', basket);
            }
        }
    }
    viewData.autoShip = autoShip;
    res.setViewData(viewData);
    return next();
});

server.prepend('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    var autoShip = false;
    var HookMgr = require('dw/system/HookMgr');
    if (HookMgr.hasHook('ordergroove.customer') === true) {
        var Site = require('dw/system/Site');
        if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveEnable') === true) {
            if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === null || Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === true) {
                var cookies = req.httpHeaders.cookie;
                autoShip = HookMgr.callHook('ordergroove.customer', 'isAutoShip', cookies);
            } else {
                var BasketMgr = require('dw/order/BasketMgr');
                var basket = BasketMgr.getCurrentBasket();
                autoShip = HookMgr.callHook('ordergroove.customer', 'isNewAutoShip', basket);
            }
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customerNo = req.currentCustomer.profile !== undefined ? req.currentCustomer.profile.customerNo : '';
            var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
            var authenticated = customer !== null ? customer.isAuthenticated() : false;
            if (autoShip === true && authenticated === false) {
                var URLUtils = require('dw/web/URLUtils');
                res.redirect(URLUtils.url('Checkout-Login'));
                next();
            }
        }
    }
    viewData.autoShip = autoShip;
    res.setViewData(viewData);
    return next();
});

server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var settings = {};
    settings.page_type = '3';
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
    viewData.productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    viewData.isConfirmStage = false;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
