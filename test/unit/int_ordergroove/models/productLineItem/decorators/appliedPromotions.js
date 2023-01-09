'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var ArrayList = require('../../../../../mocks/dw.util.Collection');
var collections = require('../../../../../mocks/util/collections');

describe('product line item applied promotions decorator', function () {
    var getPromotionStub = sinon.stub();
    var appliedPromotions = proxyquire('../../../../../../cartridges/int_ordergroove/cartridge/models/productLineItem/decorators/appliedPromotions', {
        '*/cartridge/scripts/util/collections': collections,
        'dw/web/Resource': { msg: function () { return 'test discount'; } },
        'dw/campaign/PromotionMgr': {
            getPromotion: getPromotionStub
        }
    });

    it('should create a property on the passed in object called appliedPromotions', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                calloutMsg: {
                    markup: 'someCallOutMsg'
                },
                name: 'somePromotionName',
                details: {
                    markup: 'someDetails'
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'someCallOutMsg');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, 'someDetails');
    });

    it('should use IOI Promotion calloutMsg if promotionID is OrdergrooveDPI', function () {
        getPromotionStub.reset();
        getPromotionStub.returns({
            calloutMsg: {
                markup: 'IOI calloutMsg'
            }
        });

        var object = {};

        var promotionMock = {
            promotionID: 'OrdergrooveDPI'
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'IOI calloutMsg');
        assert.isTrue(getPromotionStub.calledWith('OrdergrooveIOI'));
    });

    it('should use IOI Promotion calloutMsg if promotionID is OrdergrooveAOI', function () {
        getPromotionStub.reset();
        getPromotionStub.returns({
            calloutMsg: {
                markup: 'IOI calloutMsg'
            }
        });

        var object = {};

        var promotionMock = {
            promotionID: 'OrdergrooveAOI'
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'IOI calloutMsg');
        assert.isTrue(getPromotionStub.calledWith('OrdergrooveIOI'));
    });

    it('should use empty string if IOI Promotion calloutMsg is undefined', function () {
        getPromotionStub.reset();
        getPromotionStub.returns({});

        var object = {};

        var promotionMock = {
            promotionID: 'OrdergrooveAOI'
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, '');
        assert.isTrue(getPromotionStub.calledWith('OrdergrooveIOI'));
    });


    it('should handle no applied promotions', function () {
        var object = {};

        var lineItemMock = { priceAdjustments: new ArrayList([]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions, undefined);
    });

    it('should handle no callout message', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                name: 'somePromotionName',
                details: {
                    markup: 'someDetails'
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, '');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, 'someDetails');
    });

    it('should handle no details', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                calloutMsg: {
                    markup: 'someCallOutMsg'
                },
                name: 'somePromotionName'
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'someCallOutMsg');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, '');
    });

    it('should use default message if no promotion is available', function () {
        var object = {};

        var lineItemMock = { priceAdjustments: new ArrayList([{}]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'test discount');
    });
});
