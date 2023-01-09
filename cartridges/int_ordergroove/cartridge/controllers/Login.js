'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Logout', function (req, res, next) {
    require('*/cartridge/scripts/customerCookies').remove();
    next();
});

module.exports = server.exports();
