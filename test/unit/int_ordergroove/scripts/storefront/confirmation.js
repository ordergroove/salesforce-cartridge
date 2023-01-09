'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Ordergroove Confirmation', function () {
    var confirmation = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/confirmation', {
    });

    it('should return confirmation settings', function () {
        var confirmationSettings = confirmation.getSettings();
        assert.ok(typeof confirmationSettings === 'string');
    });
    it('should have the confirmation page type', function () {
        var expected = {
            'page_type': '4'
        };
        expected = 'og_settings = ' + JSON.stringify(expected, null, 5);
        var confirmationSettings = confirmation.getSettings();
        assert.equal(confirmationSettings, expected);
    });
});
