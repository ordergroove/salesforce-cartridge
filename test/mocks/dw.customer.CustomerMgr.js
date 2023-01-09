'use strict';

var CustomerMgr = {
    getCustomerByCustomerNumber: function (customerNo) {
        var customer000002 = {
            getID: 'someString'
        };

        if (customerNo === '') {
            return null;
        } else if (customerNo === '000002') {
            return customer000002;
        }

        return {};
    }
};


module.exports = {
    getCustomerByCustomerNumber: CustomerMgr.getCustomerByCustomerNumber
};
