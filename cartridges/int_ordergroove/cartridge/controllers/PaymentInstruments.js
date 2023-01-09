'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Checks if a credit card is valid or not
 * @param {Object} req - request object
 * @param {Object} card - plain object with card details
 * @param {Object} form - form object
 * @returns {boolean} a boolean representing card validation
 */
function verifyCard(req, card, form) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
    var PaymentInstrument = require('dw/order/PaymentInstrument');

    var currentCustomer = req.currentCustomer.raw;
    var countryCode = req.geolocation.countryCode;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentCard = PaymentMgr.getPaymentCard(card.cardType);
    var error = false;

    var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        null
    );

    var cardNumber = card.cardNumber;
    var creditCardStatus;
    var formCardNumber = form.cardNumber;

    if (paymentCard) {
        if (applicablePaymentCards.contains(paymentCard)) {
            creditCardStatus = paymentCard.verify(
                card.expirationMonth,
                card.expirationYear,
                cardNumber
            );
        } else {
            // Invalid Payment Instrument
            formCardNumber.valid = false;
            formCardNumber.error = Resource.msg('error.payment.not.valid', 'checkout', null);
            error = true;
        }
    } else {
        formCardNumber.valid = false;
        formCardNumber.error = Resource.msg('error.message.creditnumber.invalid', 'forms', null);
        error = true;
    }

    if (creditCardStatus && creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    formCardNumber.valid = false;
                    formCardNumber.error =
                        Resource.msg('error.message.creditnumber.invalid', 'forms', null);
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    var expirationMonth = form.expirationMonth;
                    var expirationYear = form.expirationYear;
                    expirationMonth.valid = false;
                    expirationMonth.error =
                        Resource.msg('error.message.creditexpiration.expired', 'forms', null);
                    expirationYear.valid = false;
                    error = true;
                    break;
                default:
                    error = true;
            }
        });
    }
    return error;
}

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        preferred: paymentForm.preferred.value,
        firstName: paymentForm.firstName.value,
        lastName: paymentForm.lastName.value,
        address1: paymentForm.address1.value,
        address2: paymentForm.address2.value,
        city: paymentForm.city.value,
        countryCode: paymentForm.country.value,
        stateCode: paymentForm.states.stateCode.value,
        postalCode: paymentForm.postalCode.value,
        phone: paymentForm.phone.value,
        paymentForm: paymentForm
    };
}

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var Site = require('dw/system/Site');
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);

    if (paymentForm.valid && !verifyCard(req, result, paymentForm)) {
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require('dw/system/Transaction');

            var formInfo = res.getViewData();
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();

            Transaction.wrap(function () {
                var paymentInstrument = wallet.createPaymentInstrument(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
                paymentInstrument.setCreditCardHolder(formInfo.name);
                paymentInstrument.setCreditCardNumber(formInfo.cardNumber);
                paymentInstrument.setCreditCardType(formInfo.cardType);
                paymentInstrument.setCreditCardExpirationMonth(formInfo.expirationMonth);
                paymentInstrument.setCreditCardExpirationYear(formInfo.expirationYear);
                var processor = PaymentMgr.getPaymentMethod(dwOrderPaymentInstrument.METHOD_CREDIT_CARD).getPaymentProcessor();
                if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') !== null && Site.getCurrent().getCustomPreferenceValue('OrderGrooveToken') === true) {
                    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                        var token = HookMgr.callHook(
                            'app.payment.processor.' + processor.ID.toLowerCase(),
                            'createToken'
                        );
                        paymentInstrument.setCreditCardToken(token);
                    }
                }
                require('*/cartridge/scripts/autoShipPaymentMethods').sync(req.currentCustomer, paymentInstrument.getUUID(), paymentForm);
            });

            // Send account edited email
            accountHelpers.sendAccountEditedEmail(customer.profile);

            res.json({
                success: true,
                redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});

module.exports = server.exports();
