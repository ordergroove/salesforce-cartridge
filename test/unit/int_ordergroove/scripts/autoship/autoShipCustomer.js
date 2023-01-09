'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var BasketMgr = require('../../../../mocks/dw.order.BasketMgr');
var HookMgr = require('../../../../mocks/dw.system.HookMgr');
var Site = require('../../../../mocks/dw.system.Site');
var URLUtils = require('../../../../mocks/dw.web.URLUtils');

describe('Auto Ship Customer', function () {
    var autoShipCustomer = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/autoShipCustomer', {
        'dw/order/BasketMgr': BasketMgr,
        'dw/system/HookMgr': HookMgr,
        'dw/system/Site': Site,
        'dw/web/URLUtils': URLUtils
    });

    var customer = {};
    customer.isAuthenticated = function () {
        return false;
    };
    var response = {};
    response.redirect = function () {
        return;
    };

    it('should utilize a hook to validate the customer', function () {
        var validate = autoShipCustomer.validate(customer, response);
        assert.equal(validate, null);
    });
    it('should return a void regardless of a redirect', function () {
        var validate = autoShipCustomer.validate(customer, response);
        assert.ok(typeof validate === 'undefined');
    });
});
