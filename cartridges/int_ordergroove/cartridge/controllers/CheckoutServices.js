'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    var viewData = res.getViewData();
    if (viewData.error !== true) {
        require('*/cartridge/scripts/purchasePost').orderNo(viewData.orderID);
    }
    return next();
});

module.exports = server.exports();
