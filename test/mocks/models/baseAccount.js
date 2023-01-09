'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var address = require('./baseAddress');

function proxyModel() {
    return proxyquire('../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/account', {
        '*/cartridge/models/address': address,
        'dw/web/URLUtils': { staticURL: function () { return 'some URL'; } }
    });
}

module.exports = proxyModel();
