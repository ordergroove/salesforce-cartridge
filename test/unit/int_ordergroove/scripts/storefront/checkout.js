'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var BasketMgr = require('../../../../mocks/dw.order.BasketMgr');

describe('Ordergroove Checkout', function () {
    var checkout = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/checkout', {
        'dw/order/BasketMgr': BasketMgr
    });

    it('should return checkout settings', function () {
        var checkoutSettings = checkout.getSettings();
        assert.ok(typeof checkoutSettings === 'string');
    });
    it('should have the checkout page data', function () {
        var expected = {
            'page_type': '3',
            'cart': {
                'products': [
                    {
                        'id': 'someString',
                        'quantity': 1
                    }
                ]
            }
        };
        expected = 'og_settings = ' + JSON.stringify(expected, null, 5);
        var checkoutSettings = checkout.getSettings();
        assert.equal(checkoutSettings, expected);
    });
});
