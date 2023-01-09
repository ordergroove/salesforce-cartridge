'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get(
        'MSI',
        server.middleware.https,
        userLoggedIn.validateLoggedIn,
        consentTracking.consent,
        function (req, res, next) {
            var Resource = require('dw/web/Resource');
            var URLUtils = require('dw/web/URLUtils');

            res.render('account/mySubscriptionInterface', {
                breadcrumbs: [
                    {
                        htmlValue: Resource.msg('global.home', 'common', null),
                        url: URLUtils.home().toString()
                    },
                    {
                        htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                        url: URLUtils.url('Account-Show').toString()
                    },
                    {
                        htmlValue: Resource.msg('page.title.msi', 'account', null),
                        url: URLUtils.url('Account-MSI').toString()
                    }
                ]
            });
            next();
        }
    );

server.append('SaveProfile', function (req, res, next) {
    this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.success !== false) {
            var HookMgr = require('dw/system/HookMgr');
            if (HookMgr.hasHook('ordergroove.customer') === true) {
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
                var profile = customer.getProfile();
                HookMgr.callHook('ordergroove.customer', 'updateCustomer', profile);
            }
        }
    });
    next();
});

module.exports = server.exports();
