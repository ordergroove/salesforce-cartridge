'use strict';

var ProductMgr = {
    getProduct: function (productID) {
        var product000002 = {
            getID: 'someString'
        };

        if (productID === '000001') {
            return product000002;
        } else if (productID === '000002') {
            return product000002;
        }
        return {};
    }
};


module.exports = {
    getProduct: ProductMgr.getProduct
};
