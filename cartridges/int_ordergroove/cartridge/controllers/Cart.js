'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var basket = BasketMgr.getCurrentOrNewBasket();
    var settings = {};
    settings.page_type = '2';
    var cart = {};
    var products = [];
    var plis = basket.getAllProductLineItems().iterator();
    while (plis.hasNext()) {
        var lineItem = {};
        var pli = plis.next();
        lineItem.id = pli.getProductID();
        lineItem.quantity = pli.getQuantityValue();
        products.push(lineItem);
    }
    cart.products = products;
    settings.cart = cart;
    viewData.productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
