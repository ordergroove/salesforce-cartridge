'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var CustomerMgr = require('../../../../mocks/dw.customer.CustomerMgr');

describe('Ordergroove PLP', function () {
    var search = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/search', {
        'dw/customer/CustomerMgr': CustomerMgr
    });

    it('should return grid page settings', function () {
        var productSettings = search.getSettings();
        assert.ok(typeof productSettings === 'string');
    });
    it('should have the grid page data', function () {
        var expected = {
            'page_type': '6',
            'logged_in': false,
            'impulse_upsell': true
        };
        expected = 'og_settings = ' + JSON.stringify(expected, null, 5);
        var productSettings = search.getSettings();
        assert.equal(productSettings, expected);
    });
});
