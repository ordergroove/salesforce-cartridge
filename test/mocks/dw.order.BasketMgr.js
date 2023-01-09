'use strict';

var ArrayList = require('./dw.util.Collection');

function getCurrentOrNewBasket() {
    return {
        getAllProductLineItems: function () {
            return new ArrayList([{
                getProductID: function () {
                    return 'someString';
                },
                getQuantityValue: function () {
                    return 1;
                }
            }]);
        },
        defaultShipment: {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '555-555-1234',
                stateCode: 'MA',

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            }
        },
        totalGrossPrice: {
            value: 250.00
        }
    };
}

function getCurrentBasket() {
    return {
        getAllProductLineItems: function () {
            return new ArrayList([{
                getProductID: function () {
                    return 'someString';
                },
                getQuantityValue: function () {
                    return 1;
                }
            }]);
        },
        defaultShipment: {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '555-555-1234',
                stateCode: 'MA',

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            }
        },
        totalGrossPrice: {
            value: 250.00
        }
    };
}

module.exports = {
    getCurrentOrNewBasket: getCurrentOrNewBasket,
    getCurrentBasket: getCurrentBasket
};
