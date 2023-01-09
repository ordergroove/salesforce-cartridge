'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Confirm', function (req, res, next) {
    require('*/cartridge/scripts/cartAutoShipCookie').remove();
    next();
});

server.append('Confirm', function (req, res, next) {
    var viewData = res.getViewData();
    var settings = {};
    settings.page_type = '4';
    viewData.productSettings = 'og_settings = ' + JSON.stringify(settings, null, 5);
    viewData.isConfirmStage = true;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
