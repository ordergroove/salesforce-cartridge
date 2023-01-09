'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var BasketMgr = require('../../../../mocks/dw.order.BasketMgr');

describe('Ordergroove Cart', function () {
    var cart = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/cart', {
        'dw/order/BasketMgr': BasketMgr
    });

    it('should return cart settings', function () {
        var cartSettings = cart.getSettings();
        assert.ok(typeof cartSettings === 'string');
    });
    it('should have the cart page data', function () {
        var expected = {
            'page_type': '2',
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
        var cartSettings = cart.getSettings();
        assert.equal(cartSettings, expected);
    });
});
