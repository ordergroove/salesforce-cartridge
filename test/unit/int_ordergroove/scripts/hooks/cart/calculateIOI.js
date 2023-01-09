'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var basket = 'testBasket';
var ioiPromotion = 'testIOIPromotion';
var discountsWithIOIPromotion = 'testDiscountsWithIOIPromotion';
var discountsWithoutIOIPromotion = 'testDiscountsWithoutIOIPromotion';

var getDiscountsStub = sinon.stub();
getDiscountsStub.returns(discountsWithIOIPromotion);

var getPromotionStub = sinon.stub();
getPromotionStub.returns(ioiPromotion);

var applyDiscountsStub = sinon.stub();

var getApplicableIOIProductLineItemsStub = sinon.stub();
var getDiscountsWithoutIOIPromotionStub = sinon.stub();
getDiscountsWithoutIOIPromotionStub.returns(discountsWithoutIOIPromotion);

var removeIncompatibleOrderDiscountsStub = sinon.stub();
var removeIncompatibleShippingDiscountsStub = sinon.stub();
var removeIncompatibleProductDiscountsStub = sinon.stub();
var removeAllOGIOIPriceAdjustmentsStub = sinon.stub();

var calculateIOI = proxyquire('../../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/cart/calculateIOI', {
    '*/cartridge/scripts/hooks/cart/calculateHelpersIOI': {
        getApplicableIOIProductLineItems: getApplicableIOIProductLineItemsStub,
        getDiscountsWithoutIOIPromotion: getDiscountsWithoutIOIPromotionStub,
        removeIncompatibleOrderDiscounts: removeIncompatibleOrderDiscountsStub,
        removeIncompatibleShippingDiscounts: removeIncompatibleShippingDiscountsStub,
        removeIncompatibleProductDiscounts: removeIncompatibleProductDiscountsStub,
        removeAllOGIOIPriceAdjustments: removeAllOGIOIPriceAdjustmentsStub
    },
    'dw/campaign/PromotionMgr': {
        getPromotion: getPromotionStub,
        getDiscounts: getDiscountsStub,
        applyDiscounts: applyDiscountsStub
    }
});

describe('calculateIOI', function () {
    beforeEach(() => {
        removeAllOGIOIPriceAdjustmentsStub.reset();
        getPromotionStub.reset();
        getDiscountsStub.reset();
        getDiscountsWithoutIOIPromotionStub.reset();
        applyDiscountsStub.reset();
        removeIncompatibleOrderDiscountsStub.reset();
        removeIncompatibleShippingDiscountsStub.reset();
        removeIncompatibleProductDiscountsStub.reset();
    });

    it('should get DiscountPlans correctly', function () {
        var applicableIOIProductLineItems = [];
        getApplicableIOIProductLineItemsStub.returns(applicableIOIProductLineItems);
        calculateIOI.applyOGIOIPromotion(basket);
        assert.isTrue(removeAllOGIOIPriceAdjustmentsStub.calledWith(basket));
        assert.isTrue(getPromotionStub.calledWith('OrdergrooveIOI'));
        assert.isTrue(getDiscountsStub.calledWith(basket));
        assert.isTrue(getDiscountsWithoutIOIPromotionStub.calledWith(basket, ioiPromotion));
    });

    it('should use non-IOI promotions if no applicable IOI productLineItems', function () {
        var applicableIOIProductLineItems = [];
        getApplicableIOIProductLineItemsStub.returns(applicableIOIProductLineItems);
        calculateIOI.applyOGIOIPromotion(basket);
        assert.isTrue(removeAllOGIOIPriceAdjustmentsStub.calledWith(basket));
        assert.isTrue(applyDiscountsStub.calledWith(discountsWithoutIOIPromotion));
        assert.isTrue(removeIncompatibleOrderDiscountsStub.notCalled);
        assert.isTrue(removeIncompatibleShippingDiscountsStub.notCalled);
        assert.isTrue(removeIncompatibleProductDiscountsStub.notCalled);
    });

    it('should remove all promotions that are incompatible with the IOI promotion if applicable IOI productLineItems', function () {
        var applicableIOIProductLineItems = ['testApplicableIOIProductLineItem'];
        getApplicableIOIProductLineItemsStub.returns(applicableIOIProductLineItems);
        calculateIOI.applyOGIOIPromotion(basket);
        assert.isTrue(removeAllOGIOIPriceAdjustmentsStub.calledWith(basket));
        assert.isTrue(removeIncompatibleOrderDiscountsStub.calledWith(discountsWithoutIOIPromotion, discountsWithIOIPromotion));
        assert.isTrue(removeIncompatibleShippingDiscountsStub.calledWith(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion));
        assert.isTrue(removeIncompatibleProductDiscountsStub.calledWith(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, applicableIOIProductLineItems, ioiPromotion));
        assert.isTrue(applyDiscountsStub.calledWith(discountsWithoutIOIPromotion));
        assert.isTrue(applyDiscountsStub.calledAfter(removeIncompatibleOrderDiscountsStub));
        assert.isTrue(applyDiscountsStub.calledAfter(removeIncompatibleShippingDiscountsStub));
        assert.isTrue(applyDiscountsStub.calledAfter(removeIncompatibleProductDiscountsStub));
    });
});
