'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var pid = viewData.product.id;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(pid);
    var settings = {};
    if (product !== null) {
        settings.page_type = '1';
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var customerNo = req.currentCustomer.profile !== undefined ? req.currentCustomer.profile.customerNo : '';
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
        settings.logged_in = customer !== null ? customer.isAuthenticated() : false;
        settings.impulse_upsell = true;
    }
    viewData.productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
