'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var CustomerMgr = require('../../../../mocks/dw.customer.CustomerMgr');
var ProductMgr = require('../../../../mocks/dw.catalog.ProductMgr');

describe('Ordergroove PDP', function () {
    var product = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/product', {
        'dw/catalog/ProductMgr': ProductMgr,
        'dw/customer/CustomerMgr': CustomerMgr
    });

    it('should return product settings', function () {
        var testProduct = {
            object: { ID: '000001' }
        };
        var productSettings = product.getSettings(testProduct);
        assert.ok(typeof productSettings === 'string');
    });
    it('should have the product page data', function () {
        var expected = {
            'page_type': '1',
            'logged_in': false,
            'impulse_upsell': true
        };
        var testProduct = {
            object: { ID: '000002' }
        };
        expected = 'og_settings = ' + JSON.stringify(expected, null, 5);
        var productSettings = product.getSettings(testProduct);
        assert.equal(productSettings, expected);
    });
});
