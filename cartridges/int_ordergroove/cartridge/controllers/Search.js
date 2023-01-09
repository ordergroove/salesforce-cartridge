'use strict';

var server = require('server');
server.extend(module.superModule);

// var ArrayList = require('dw/util/ArrayList');

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    // var productList = new ArrayList(viewData.productSearch.productIds);
    var settings = {};
    settings.page_type = '6';
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customerNo = req.currentCustomer.profile !== undefined ? req.currentCustomer.profile.customerNo : '';
    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    settings.logged_in = customer !== null ? customer.isAuthenticated() : false;
    settings.impulse_upsell = true;
    viewData.productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
