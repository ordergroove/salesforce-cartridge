'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var path = '../../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/cart/calculateHelpersIOI';

var createList = function (array) {
    var innerArray = array;
    var index = 0;

    return {
        id: 2,
        name: '',
        iterator: function () {
            return {
                items: innerArray,
                hasNext: function () {
                    return index < innerArray.length;
                },
                next: function () {
                    return innerArray[index++];
                }
            };
        },
        contains: function (value) {
            for (var i = 0; i < innerArray.length; i++) {
                if (innerArray[i] === value) {
                    return true;
                }
            }
            return false;
        }
    };
};

var ArrayListStub = function () {
    this.innerArray = [];
    this.innerIndex = 0;
};
ArrayListStub.prototype.add = function (element) {
    this.innerArray[this.innerIndex] = element;
    this.innerIndex++;
};

ArrayListStub.prototype.count = function () {
    return this.innerIndex;
};

describe('calculateHelpersIOI', function () {
    var ioiPromotion = 'testIOIPromotion';

    var nonIOIDiscount = {
        getPromotion: sinon.stub().returns('nonIOIPromotion')
    };
    var ioiDiscount = {
        getPromotion: sinon.stub().returns(ioiPromotion)
    };

    describe('attemptRemoveOGIOIDiscounts', function () {
        var productLineItem = 'testProductLineItem';

        var productDiscounts = [];

        var discountsWithIOIPromotion = {
            getProductDiscounts: function () {
                return createList(productDiscounts);
            }
        };

        var removeDiscountStub = sinon.stub();

        var discountsWithoutIOIPromotionStub = {
            removeDiscount: removeDiscountStub
        };

        var requiredStubs = {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        };

        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        beforeEach(() => {
            removeDiscountStub.reset();
        });

        it('should not remove OG IOI Discounts when productDiscounts is empty', function () {
            productDiscounts = [];
            calculateHelpersIOI.attemptRemoveOGIOIDiscounts(discountsWithoutIOIPromotionStub, discountsWithIOIPromotion, productLineItem, ioiPromotion);
            assert.isTrue(removeDiscountStub.notCalled);
        });

        it('should only remove OG IOI Discounts when promotion is IOIPromotion', function () {
            productDiscounts = [nonIOIDiscount, ioiDiscount];
            calculateHelpersIOI.attemptRemoveOGIOIDiscounts(discountsWithoutIOIPromotionStub, discountsWithIOIPromotion, productLineItem, ioiPromotion);
            assert.isFalse(removeDiscountStub.calledWith(nonIOIDiscount));
            assert.isTrue(removeDiscountStub.calledWith(ioiDiscount));
        });
    });

    describe('discountsContainPromotion', function () {
        var requiredStubs = {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        };

        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        it('should return false when discounts are empty', function () {
            var discounts = [];
            var discountsList = createList(discounts);
            assert.isFalse(calculateHelpersIOI.discountsContainPromotion(discountsList, ioiPromotion));
        });

        it('should return false when discounts does not contain IOIPromotion', function () {
            var discounts = [nonIOIDiscount, nonIOIDiscount];
            var discountsList = createList(discounts);
            assert.isFalse(calculateHelpersIOI.discountsContainPromotion(discountsList, ioiPromotion));
        });

        it('should return true when discounts contain IOIPromotion', function () {
            var discounts = [nonIOIDiscount, ioiDiscount];
            var discountsList = createList(discounts);
            assert.isTrue(calculateHelpersIOI.discountsContainPromotion(discountsList, ioiPromotion));
        });
    });

    describe('removeIncompatibleProductDiscounts', function () {
        var productLineItem = 'testProductLineItem';

        var basketProductLineItems = [productLineItem];

        var basket = {
            getAllProductLineItems: function () {
                return createList(basketProductLineItems);
            }
        };

        var productDiscountsWithIOIPromotion = 'testProductDiscountsWithIOIPromotion';
        var discountsWithIOIPromotion = {
            getProductDiscounts: function () {
                return productDiscountsWithIOIPromotion;
            }
        };

        var productDiscountsWithoutIOIPromotion = 'testProductDiscountsWithoutIOIPromotion';
        var discountsWithoutIOIPromotion = {
            getProductDiscounts: function () {
                return productDiscountsWithoutIOIPromotion;
            }
        };

        var EXCLUSIVITY_GLOBAL = 'globalExclusivity';
        var EXCLUSIVITY_NONGLOBAL = 'nonGlobalExclusivity';

        var requiredStubs = {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': {
                EXCLUSIVITY_GLOBAL: EXCLUSIVITY_GLOBAL
            },
            'dw/campaign/PromotionMgr': function () {}
        };

        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var applyOGIOIPromotionStub = sinon.stub(calculateHelpersIOI, 'applyOGIOIPromotion');
        var removeDiscountsIncompatibleWithIOIStub = sinon.stub(calculateHelpersIOI, 'removeDiscountsIncompatibleWithIOI');
        var attemptRemoveOGIOIDiscountsStub = sinon.stub(calculateHelpersIOI, 'attemptRemoveOGIOIDiscounts');

        beforeEach(() => {
            applyOGIOIPromotionStub.reset();
            removeDiscountsIncompatibleWithIOIStub.reset();
            attemptRemoveOGIOIDiscountsStub.reset();
        });

        it('should apply OG IOI Promotion and remove incompatible discounts for subscribed product', function () {
            var ioiPromotionNonGlobalExclusivity = {
                exclusivity: EXCLUSIVITY_NONGLOBAL
            };
            var applicableIOIProductLineItems = [productLineItem];
            calculateHelpersIOI.removeIncompatibleProductDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, createList(applicableIOIProductLineItems), ioiPromotionNonGlobalExclusivity);
            assert.isTrue(applyOGIOIPromotionStub.calledWith(discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.calledWith(discountsWithoutIOIPromotion, productDiscountsWithoutIOIPromotion, productDiscountsWithIOIPromotion));
            assert.isFalse(attemptRemoveOGIOIDiscountsStub.calledWith(discountsWithoutIOIPromotion, discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
        });

        it('should remove OG IOI Promotion and keep incompatible discounts for unsubscribed product with IOI promotion non-global exclusivity', function () {
            var ioiPromotionNonGlobalExclusivity = {
                exclusivity: EXCLUSIVITY_NONGLOBAL
            };
            var applicableIOIProductLineItems = [];
            calculateHelpersIOI.removeIncompatibleProductDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, createList(applicableIOIProductLineItems), ioiPromotionNonGlobalExclusivity);
            assert.isFalse(applyOGIOIPromotionStub.calledWith(discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
            assert.isFalse(removeDiscountsIncompatibleWithIOIStub.calledWith(discountsWithoutIOIPromotion, productDiscountsWithoutIOIPromotion, productDiscountsWithIOIPromotion));
            assert.isTrue(attemptRemoveOGIOIDiscountsStub.calledWith(discountsWithoutIOIPromotion, discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
        });

        it('should remove OG IOI Promotion and remove incompatible discounts for unsubscribed product with IOI promotion global exclusivity', function () {
            var ioiPromotionNonGlobalExclusivity = {
                exclusivity: EXCLUSIVITY_GLOBAL
            };
            var applicableIOIProductLineItems = [];
            calculateHelpersIOI.removeIncompatibleProductDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, createList(applicableIOIProductLineItems), ioiPromotionNonGlobalExclusivity);
            assert.isFalse(applyOGIOIPromotionStub.calledWith(discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.calledWith(discountsWithoutIOIPromotion, productDiscountsWithoutIOIPromotion, productDiscountsWithIOIPromotion));
            assert.isTrue(attemptRemoveOGIOIDiscountsStub.calledWith(discountsWithoutIOIPromotion, discountsWithIOIPromotion, productLineItem, ioiPromotionNonGlobalExclusivity));
        });
    });

    describe('removeAllOGIOIPriceAdjustments', function () {
        var requiredStubs = {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        };

        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var removeOGIOIPriceAdjustmentsStub = sinon.stub(calculateHelpersIOI, 'removeOGIOIPriceAdjustments');

        beforeEach(() => {
            removeOGIOIPriceAdjustmentsStub.reset();
        });

        it('should not call removeOGIOIPriceAdjustments for empty list', function () {
            var basketProductLineItems = [];

            var basket = {
                getAllProductLineItems: function () {
                    return createList(basketProductLineItems);
                }
            };
            calculateHelpersIOI.removeAllOGIOIPriceAdjustments(basket);
            assert.isTrue(removeOGIOIPriceAdjustmentsStub.notCalled);
        });

        it('should call removeOGIOIPriceAdjustments for each product', function () {
            var productLineItem1 = 'testProductLineItem1';
            var productLineItem2 = 'testProductLineItem2';

            var basketProductLineItems = [productLineItem1, productLineItem2];

            var basket = {
                getAllProductLineItems: function () {
                    return createList(basketProductLineItems);
                }
            };
            calculateHelpersIOI.removeAllOGIOIPriceAdjustments(basket);
            assert.isTrue(removeOGIOIPriceAdjustmentsStub.calledTwice);
            assert.isTrue(removeOGIOIPriceAdjustmentsStub.calledWith(productLineItem1));
            assert.isTrue(removeOGIOIPriceAdjustmentsStub.calledWith(productLineItem2));
        });
    });

    describe('applyOGIOIDiscounts', function () {
        var AmountDiscountStub = sinon.stub();
        var PercentageDiscountStub = sinon.stub();
        var requiredStubs = {
            'dw/campaign/AmountDiscount': AmountDiscountStub,
            'dw/campaign/PercentageDiscount': PercentageDiscountStub,
            'dw/campaign/Promotion': {},
            'dw/campaign/PromotionMgr': {},
            'dw/util/ArrayList': {}
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var createPriceAdjustmentStub = sinon.stub();
        var fakeProductLineItem = {
            createPriceAdjustment: createPriceAdjustmentStub
        };

        beforeEach(() => {
            AmountDiscountStub.reset();
            PercentageDiscountStub.reset();
            createPriceAdjustmentStub.reset();
        });

        it('It should create price adjustments for each IOIAmountOff and IOIPercentOff', function () {
            var ioiPromotionObject = {
                custom: {
                    IOIAmountOff: 'Test IOIAmountOff',
                    IOIPercentOff: 'Test IOIPercentOff'
                }
            };

            calculateHelpersIOI.applyOGIOIDiscounts(fakeProductLineItem, ioiPromotionObject);

            assert.isTrue(createPriceAdjustmentStub.calledTwice);
            assert.isTrue(createPriceAdjustmentStub.calledWith('OrdergrooveAOI', sinon.match.instanceOf(AmountDiscountStub)));
            assert.isTrue(createPriceAdjustmentStub.calledWith('OrdergrooveDPI', sinon.match.instanceOf(PercentageDiscountStub)));
            assert.isTrue(AmountDiscountStub.calledWith('Test IOIAmountOff'));
            assert.isTrue(PercentageDiscountStub.calledWith('Test IOIPercentOff'));
        });

        it('It should not create price adjustments', function () {
            var ioiPromotionObject = {
                custom: {
                    IOIAmountOff: null,
                    IOIPercentOff: null
                }
            };

            calculateHelpersIOI.applyOGIOIDiscounts(fakeProductLineItem, ioiPromotionObject);

            assert.isTrue(createPriceAdjustmentStub.notCalled);
            assert.isTrue(AmountDiscountStub.notCalled);
            assert.isTrue(PercentageDiscountStub.notCalled);
        });
    });

    describe('removeOGIOIPriceAdjustments', function () {
        var requiredStubs = {
            'dw/campaign/AmountDiscount': {},
            'dw/campaign/PercentageDiscount': {},
            'dw/campaign/Promotion': {},
            'dw/campaign/PromotionMgr': {},
            'dw/util/ArrayList': {}
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var getPriceAdjustmentByPromotionIDStub = sinon.stub();
        var removePriceAdjustmentStub = sinon.stub();
        var fakeProductLineItem = {
            getPriceAdjustmentByPromotionID: getPriceAdjustmentByPromotionIDStub,
            removePriceAdjustment: removePriceAdjustmentStub
        };


        beforeEach(() => {
            getPriceAdjustmentByPromotionIDStub.reset();
            removePriceAdjustmentStub.reset();
        });

        it('It should not call removePriceAdjustment', function () {
            getPriceAdjustmentByPromotionIDStub.returns(null);

            calculateHelpersIOI.removeOGIOIPriceAdjustments(fakeProductLineItem);

            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledTwice);
            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledWith('OrdergrooveAOI'));
            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledWith('OrdergrooveDPI'));
            assert.isTrue(removePriceAdjustmentStub.notCalled);
        });

        it('It should call removePriceAdjustment twice', function () {
            getPriceAdjustmentByPromotionIDStub.withArgs('OrdergrooveAOI').returns('Test amountOffAdjustment');
            getPriceAdjustmentByPromotionIDStub.withArgs('OrdergrooveDPI').returns('Test discountPercentAdjustment');

            calculateHelpersIOI.removeOGIOIPriceAdjustments(fakeProductLineItem);

            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledTwice);
            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledWith('OrdergrooveAOI'));
            assert.isTrue(getPriceAdjustmentByPromotionIDStub.calledWith('OrdergrooveDPI'));
            assert.isTrue(removePriceAdjustmentStub.calledTwice);
            assert.isTrue(removePriceAdjustmentStub.calledWith('Test amountOffAdjustment'));
            assert.isTrue(removePriceAdjustmentStub.calledWith('Test discountPercentAdjustment'));
        });
    });

    describe('removeDiscountsIncompatibleWithIOI', function () {
        var requiredStubs = {
            'dw/campaign/AmountDiscount': {},
            'dw/campaign/PercentageDiscount': {},
            'dw/campaign/Promotion': {},
            'dw/campaign/PromotionMgr': {},
            'dw/util/ArrayList': {}
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var removeDiscountStub = sinon.stub();
        var newDiscounts = {
            removeDiscount: removeDiscountStub
        };

        beforeEach(() => {
            removeDiscountStub.reset();
        });

        it('It should call removeDiscount when discount with IOI promotion and discount without IOI promotion are different', function () {
            var discountsWithoutIOIPromotion = createList([nonIOIDiscount]);
            var discountsWithIOIPromotion = createList([ioiDiscount]);

            calculateHelpersIOI.removeDiscountsIncompatibleWithIOI(newDiscounts, discountsWithoutIOIPromotion, discountsWithIOIPromotion);
            assert.isTrue(removeDiscountStub.calledWith(nonIOIDiscount));
        });

        it('It should not call removeDiscount when discount with IOI promotion and discount without IOI promotion are the same', function () {
            var discountsWithoutIOIPromotion = createList([nonIOIDiscount]);
            var discountsWithIOIPromotion = createList([nonIOIDiscount]);

            calculateHelpersIOI.removeDiscountsIncompatibleWithIOI(newDiscounts, discountsWithoutIOIPromotion, discountsWithIOIPromotion);
            assert.isTrue(removeDiscountStub.notCalled);
        });
    });

    describe('removeIncompatibleOrderDiscounts', function () {
        var requiredStubs = {
            'dw/campaign/AmountDiscount': {},
            'dw/campaign/PercentageDiscount': {},
            'dw/campaign/Promotion': {},
            'dw/campaign/PromotionMgr': {},
            'dw/util/ArrayList': {}
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var getOrderDiscountsStub = sinon.stub();
        var fakeDiscountsWithIOIPromotion = {
            getOrderDiscounts: getOrderDiscountsStub
        };
        var fakeDiscountsWithoutIOIPromotion = {
            getOrderDiscounts: getOrderDiscountsStub
        };
        var removeDiscountsIncompatibleWithIOIStub = sinon.stub(calculateHelpersIOI, 'removeDiscountsIncompatibleWithIOI');

        it('It should call getOrderDiscountsStub and removeDiscountsIncompatibleWithIOIStub', function () {
            getOrderDiscountsStub.onFirstCall().returns('Test orderDiscountsWithIOIPromotion');
            getOrderDiscountsStub.onSecondCall().returns('Test orderDiscountsWithoutIOIPromotion');

            calculateHelpersIOI.removeIncompatibleOrderDiscounts(fakeDiscountsWithoutIOIPromotion, fakeDiscountsWithIOIPromotion);

            assert.isTrue(getOrderDiscountsStub.calledTwice);
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.calledWith(fakeDiscountsWithoutIOIPromotion, 'Test orderDiscountsWithoutIOIPromotion', 'Test orderDiscountsWithIOIPromotion'));
        });
    });

    describe('getDiscountsWithoutIOIPromotion', function () {
        var basket = 'testBasket';

        var getActivePromotionResponse = sinon.stub();
        getActivePromotionResponse.removePromotion = function () {};
        var getActivePromotionsStub = sinon.stub().returns(getActivePromotionResponse);

        var getDiscountsStub = sinon.stub();

        var calculateHelpersIOI = proxyquire('../../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/cart/calculateHelpersIOI', {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': {
                getActivePromotions: getActivePromotionsStub,
                getDiscounts: getDiscountsStub }
        });

        it('function called correctly', function () {
            calculateHelpersIOI.getDiscountsWithoutIOIPromotion(basket, ioiPromotion);
            assert.isTrue(getActivePromotionsStub.calledWith());
            assert.isTrue(getDiscountsStub.calledWith(basket));
        });
    });

    describe('applyOGIOIPromotion', function () {
        var productLineItem = 'productlineitem';
        var productDiscounts = [];

        var discountsWithIOIPromotion = {
            getProductDiscounts: function () {
                return createList(productDiscounts);
            }
        };

        var calculateHelpersIOI = proxyquire('../../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/cart/calculateHelpersIOI', {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        });

        var applyOGIOIDiscountsStub = sinon.stub(calculateHelpersIOI, 'applyOGIOIDiscounts');

        beforeEach(() => {
            applyOGIOIDiscountsStub.reset();
        });

        it('tested for empty product discounts', function () {
            productDiscounts = [];
            calculateHelpersIOI.applyOGIOIPromotion(discountsWithIOIPromotion, productLineItem, ioiPromotion);
            assert.isTrue(applyOGIOIDiscountsStub.notCalled);
        });

        it('should call applyOGIOIDiscounts once', function () {
            productDiscounts = [nonIOIDiscount, ioiDiscount];
            calculateHelpersIOI.applyOGIOIPromotion(discountsWithIOIPromotion, productLineItem, ioiPromotion);
            assert.isTrue(applyOGIOIDiscountsStub.calledWith(productLineItem, ioiPromotion));
            assert.isTrue(applyOGIOIDiscountsStub.calledOnce);
        });

        it('should call applyOGIOIDiscounts twice', function () {
            productDiscounts = [ioiDiscount, ioiDiscount];
            calculateHelpersIOI.applyOGIOIPromotion(discountsWithIOIPromotion, productLineItem, ioiPromotion);
            assert.isTrue(applyOGIOIDiscountsStub.calledWith(productLineItem, ioiPromotion));
            assert.isTrue(applyOGIOIDiscountsStub.calledTwice);
        });
    });

    describe('removeIncompatibleShippingDiscounts', function () {
        var discountsWithoutIOIPromotion = {
            getShippingDiscounts: function () {
                return 'withoutioipromotion';
            }
        };

        var discountsWithIOIPromotion = {
            getShippingDiscounts: function () {
                return 'withioipromotion';
            }
        };

        var calculateHelpersIOI = proxyquire('../../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/cart/calculateHelpersIOI', {
            'dw/util/ArrayList': function () {},
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        });

        var removeDiscountsIncompatibleWithIOIStub = sinon.stub(calculateHelpersIOI, 'removeDiscountsIncompatibleWithIOI');

        beforeEach(() => {
            removeDiscountsIncompatibleWithIOIStub.reset();
        });

        it('tested for empty shipments', function () {
            var basket = {
                shipments: createList([])
            };

            calculateHelpersIOI.removeIncompatibleShippingDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion);
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.notCalled);
        });

        it('tested for multiple shipments', function () {
            var shipments = ['shipment1', 'shipment2'];
            var basket = {
                shipments: createList(shipments)
            };

            calculateHelpersIOI.removeIncompatibleShippingDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion);
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.calledTwice);
            assert.isTrue(removeDiscountsIncompatibleWithIOIStub.calledWith(discountsWithoutIOIPromotion, 'withoutioipromotion', 'withioipromotion'));
        });
    });


    describe('getProductOptins', function () {
        var mockCookie = function (fakeName, fakeValue) {
            return {
                name: fakeName,
                value: fakeValue,
                getName: function () {
                    return this.name;
                },
                getValue: function () {
                    return this.value;
                }
            };
        };

        var mockHttpCookies = [];
        mockHttpCookies.getCookieCount = function () {
            return mockHttpCookies.length;
        };

        var legacyOfferEnabled = null;
        var mockSite = {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function () {
                        return legacyOfferEnabled;
                    }
                };
            }
        };

        var requiredStubs = {
            'dw/campaign/AmountDiscount': {},
            'dw/campaign/PercentageDiscount': {},
            'dw/campaign/Promotion': {},
            'dw/campaign/PromotionMgr': {},
            'dw/util/ArrayList': {},
            'dw/system/Site': mockSite
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);

        var mockRequest = {
            getHttpCookies: function () {
                return mockHttpCookies;
            }
        };

        beforeEach(() => {
            legacyOfferEnabled = null;
            mockHttpCookies.length = 0;
        });

        it('Legacy Offer Enabled true: It should return null when no cookies exist', function () {
            global.request = {
                getHttpCookies: function () {
                    return null;
                }
            };
            legacyOfferEnabled = true;
            var basket = {};

            var optins = calculateHelpersIOI.getProductOptins(basket);
            assert.equal(null, optins);
        });

        it('Legacy Offer Enabled true: It should return null when og_cart_autoship cookie does not exist', function () {
            global.request = mockRequest;
            legacyOfferEnabled = true;
            mockHttpCookies.push(mockCookie('fake_cookie', 'fake_value'));
            var basket = {};

            var optins = calculateHelpersIOI.getProductOptins(basket);
            assert.equal(null, optins);
        });

        it('Legacy Offer Enabled true: It should return all product ids from og_cart_autoship cookie', function () {
            global.request = mockRequest;
            legacyOfferEnabled = true;
            mockHttpCookies.push(mockCookie('fake_cookie', 'fake_value'));
            mockHttpCookies.push(mockCookie('another_fake_cookie', 'another_fake_value'));
            mockHttpCookies.push(mockCookie('og_cart_autoship', '[{%22id%22:%22product1%22%2C%22e%22:1%2C%22p%22:3}%2C{%22id%22:%22product2%22%2C%22e%22:3%2C%22p%22:3}]'));
            var basket = {};

            var optins = calculateHelpersIOI.getProductOptins(basket);
            assert.equal(2, optins.length);

            var ids = [];
            for (var i = 0; i < optins.length; i++) {
                ids.push(optins[i].product);
            }
            assert.isTrue(ids.includes('product1'));
            assert.isTrue(ids.includes('product2'));
        });

        it('Legacy Offer Enabled false: It should return null when no optins exist in basket', function () {
            legacyOfferEnabled = false;
            var basket = {
                custom: { subscriptionOptins: null }
            };

            var optins = calculateHelpersIOI.getProductOptins(basket);
            assert.equal(null, optins);
        });

        it('Legacy Offer Enabled false: It should return all product ids when optins exist in basket', function () {
            legacyOfferEnabled = false;
            var json = JSON.stringify([{ product: 'product1' }, { product: 'product2' }]);
            var basket = {
                custom: { subscriptionOptins: json }
            };

            var optins = calculateHelpersIOI.getProductOptins(basket);
            assert.equal(2, optins.length);

            var ids = [];
            for (var i = 0; i < optins.length; i++) {
                ids.push(optins[i].product);
            }
            assert.isTrue(ids.includes('product1'));
            assert.isTrue(ids.includes('product2'));
        });
    });

    describe('getApplicableIOIProductLineItems', function () {
        var requiredStubs = {
            'dw/util/ArrayList': ArrayListStub,
            'dw/campaign/PercentageDiscount': function () {},
            'dw/campaign/AmountDiscount': function () {},
            'dw/campaign/Promotion': function () {},
            'dw/campaign/PromotionMgr': function () {}
        };
        var calculateHelpersIOI = proxyquire(path, requiredStubs);
        var discountWithIOIPromotion = 'discountWithIOIPromotion';
        var getProductOptinsStub = sinon.stub(calculateHelpersIOI, 'getProductOptins');

        beforeEach(() => {
            getProductOptinsStub.reset();
        });

        it('for empty subscriptionOptins', function () {
            var optins = null;
            getProductOptinsStub.returns(optins);
            var basket = {};

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with for no product line items', function () {
            var optins = [{ product: 'product' }];
            getProductOptinsStub.returns(optins);
            var basket = {
                getAllProductLineItems: function () {
                    return createList([]);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with product line items but no subscriptionOptins', function () {
            var optins = null;
            getProductOptinsStub.returns(optins);
            var basket = {
                getAllProductLineItems: function () {
                    return createList(['product1', 'product2']);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with product line item productid not matches with subscriptionOptins id', function () {
            var optins = [{ product: 'product1' }];
            getProductOptinsStub.returns(optins);
            var productLineItem = { productID: 'product2' };
            var basket = {
                getAllProductLineItems: function () {
                    return createList([productLineItem]);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with product line item productid matches with subscriptionOptins id but no product discounts', function () {
            var optins = [{ product: 'product1' }];
            getProductOptinsStub.returns(optins);
            var productDiscounts = [];
            var productLineItem = { productID: 'product1' };
            discountWithIOIPromotion = {
                getProductDiscounts: function () {
                    return createList(productDiscounts);
                }
            };
            var basket = {
                getAllProductLineItems: function () {
                    return createList([productLineItem]);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with product line item productid matches with subscriptionOptins id with product discounts non ioi discount', function () {
            var optins = [{ product: 'product1' }];
            getProductOptinsStub.returns(optins);
            var productDiscounts = [nonIOIDiscount, nonIOIDiscount];
            var productLineItem = { productID: 'product1' };
            discountWithIOIPromotion = {
                getProductDiscounts: function () {
                    return createList(productDiscounts);
                }
            };
            var basket = {
                getAllProductLineItems: function () {
                    return createList([productLineItem]);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.deepEqual(response, new ArrayListStub());
        });

        it('with product line item productid matches with subscriptionOptins id with product discounts matching ioi discount', function () {
            var optins = [{ product: 'product1' }];
            getProductOptinsStub.returns(optins);
            var productDiscounts = [nonIOIDiscount, ioiDiscount];
            var productLineItem = { productID: 'product1' };
            discountWithIOIPromotion = {
                getProductDiscounts: function () {
                    return createList(productDiscounts);
                }
            };
            var basket = {
                getAllProductLineItems: function () {
                    return createList([productLineItem]);
                }
            };

            var response = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountWithIOIPromotion, ioiPromotion);
            assert.isTrue(response.count() === 1);
        });
    });
});
