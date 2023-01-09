var ArrayList = require('dw/util/ArrayList');
var PercentageDiscount = require('dw/campaign/PercentageDiscount');
var AmountDiscount = require('dw/campaign/AmountDiscount');
var Promotion = require('dw/campaign/Promotion');
var PromotionMgr = require('dw/campaign/PromotionMgr');

var discountPercentId = 'OrdergrooveDPI';
var amountOffId = 'OrdergrooveAOI';

/**
 * Applies the given OG IOI Promotion to the given productLineItem
 *
 * @param {*} productLineItem The productLineItem to which the given OG IOI Promotion should be applied
 * @param {*} ioiPromotion The OG IOI Promotion to apply to the given productLineItem
 */
function applyOGIOIDiscounts(productLineItem, ioiPromotion) {
    // Add OG IOI promotion discounts as a price adjustment if the product is opted into a  subscription
    var discountPercent = ioiPromotion.custom.IOIPercentOff;
    var amountOff = ioiPromotion.custom.IOIAmountOff;

    if (amountOff != null) {
        productLineItem.createPriceAdjustment(amountOffId, new AmountDiscount(amountOff));
    }

    if (discountPercent != null) {
        productLineItem.createPriceAdjustment(discountPercentId, new PercentageDiscount(discountPercent));
    }
}

/**
 * Applies the given OG IOI Promotion to the given productLineItem if the given discounts contain the IOI Promotion
 *
 * @param {*} discountsWithIOIPromotion The discounts containing the given OG IOI promotion
 * @param {*} productLineItem The productLineItem to which the given OG IOI Promotion should be applied
 * @param {*} ioiPromotion The OG IOI Promotion to apply to the given productLineItem
 */
function applyOGIOIPromotion(discountsWithIOIPromotion, productLineItem, ioiPromotion) {
    var productDiscounts = discountsWithIOIPromotion.getProductDiscounts(productLineItem).iterator();
    while (productDiscounts.hasNext()) {
        var productDiscount = productDiscounts.next();
        if (productDiscount.getPromotion() === ioiPromotion) {
            this.applyOGIOIDiscounts(productLineItem, ioiPromotion);
        }
    }
}

/**
 * Removes the given OG IOI Promotion from the given DiscountPlan if the given discounts contain the IOI Promotion for the given productLineItem
 *
 * @param {*} discountsWithoutIOIPromotion The DiscountPlan from which the given OG IOI Promotion should be removed
 * @param {*} discountsWithIOIPromotion The discounts containing the given OG IOI promotion
 * @param {*} productLineItem The productLineItem to which the given OG IOI Promotion should be removed
 * @param {*} ioiPromotion The OG IOI Promotion to remove from the given DiscountPlan
 */
function attemptRemoveOGIOIDiscounts(discountsWithoutIOIPromotion, discountsWithIOIPromotion, productLineItem, ioiPromotion) {
    var productDiscounts = discountsWithIOIPromotion.getProductDiscounts(productLineItem).iterator();
    while (productDiscounts.hasNext()) {
        var productDiscount = productDiscounts.next();
        if (productDiscount.getPromotion() === ioiPromotion) {
            discountsWithoutIOIPromotion.removeDiscount(productDiscount);
            return;
        }
    }
}

/**
 * Removes the OG IOI Price Adjustments from the givenProductLineItem
 *
 * @param {*} productLineItem The productLineItem from which the given OG IOI Price Adjustments should be removed
 */
function removeOGIOIPriceAdjustments(productLineItem) {
    // Remove all OG IOI Discounts in preparation for promotion calculations
    var amountOffAdjustment = productLineItem.getPriceAdjustmentByPromotionID(amountOffId);
    var discountPercentAdjustment = productLineItem.getPriceAdjustmentByPromotionID(discountPercentId);

    if (amountOffAdjustment) {
        productLineItem.removePriceAdjustment(amountOffAdjustment);
    }

    if (discountPercentAdjustment) {
        productLineItem.removePriceAdjustment(discountPercentAdjustment);
    }
}

 /**
  * Returns a list of productLineItems that are opted into subscription in the given basket and
  * have the given OG IOI Promotion applied to them in the given DiscountPlan
  *
  * @param {*} basket The basket containing the products opted into subscription
  * @param {*} discountsWithIOIPromotion The DiscountPlan containing the given IOI promotions
  * @param {*} ioiPromotion The OG IOI Promotion to check
  * @returns {ArrayList} An ArrayList containing subscribed products that
  */
function getApplicableIOIProductLineItems(basket, discountsWithIOIPromotion, ioiPromotion) {
    var applicableIOIProductLineItems = new ArrayList();

    var optins = this.getProductOptins(basket);
    if (!optins) {
        return applicableIOIProductLineItems;
    }

    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();

        for (var x = 0; x < optins.length; x++) {
            var productId = optins[x].product;

            if (productLineItem.productID === productId) {
                var productDiscounts = discountsWithIOIPromotion.getProductDiscounts(productLineItem).iterator();
                while (productDiscounts.hasNext()) {
                    var productDiscount = productDiscounts.next();
                    if (productDiscount.getPromotion() === ioiPromotion) {
                        applicableIOIProductLineItems.add(productLineItem);
                        break;
                    }
                }
                break;
            }
        }
    }
    return applicableIOIProductLineItems;
}

/**
 * Returns an array of dictionaries, each dictionary contains the id of a product that is opted into a subscription,
 * generated from either the basket or the request cookies depending on if legacy offers are enabled
 *
 * @param {*} basket The basket containing the products that have discounts
 * @returns {Array} An Array of dictionaries, each with a single key of "product" and a value of an id
 */
function getProductOptins(basket) {
    var Site = require('dw/system/Site');
    var productOptins = null;

    if (Site.getCurrent().getCustomPreferenceValue('OrderGrooveLegacyOffer') === false) {
        productOptins = JSON.parse(basket.custom.subscriptionOptins);
    } else {
        var cookies = request.getHttpCookies(); //eslint-disable-line
        if (cookies) {
            var ogCartCookieValue = null;
            for (let i = 0; i < cookies.getCookieCount(); i++) {
                var cookie = cookies[i];
                var cookieName = cookie.getName();
                if (cookieName === 'og_cart_autoship') {
                    ogCartCookieValue = JSON.parse(decodeURIComponent(cookie.getValue()));
                    break;
                }
            }

            if (ogCartCookieValue && ogCartCookieValue.length) {
                productOptins = [];
                for (let i = 0; i < ogCartCookieValue.length; i++) {
                    var id = ogCartCookieValue[i].id;
                    productOptins.push({ product: id });
                }
            }
        }
    }
    return productOptins;
}

/**
 * Returns whether or not the given discounts contain the given promotion
 *
 * @param {*} discounts The discounts to check for the given promotion
 * @param {*} promotion The promotion to check for in the given discounts
 * @returns {boolean} Whether or not the given discounts contain the given promotion
 */
function discountsContainPromotion(discounts, promotion) {
    var discountsIterator = discounts.iterator();
    while (discountsIterator.hasNext()) {
        if (discountsIterator.next().getPromotion() === promotion) {
            return true;
        }
    }
    return false;
}

/**
 *  Removes discounts that are in discountsWithoutIOIPromotion and not in discountsWithIOIPromotion from newDiscounts
 *
 * @param {*} newDiscounts The DiscountPlan from which to remove discounts that are incompatible with the OG IOI Promotion
 * @param {*} discountsWithoutIOIPromotion The discounts without the OG IOI Promotion
 * @param {*} discountsWithIOIPromotion  The discounts with the IOI OG Promotion
 */
function removeDiscountsIncompatibleWithIOI(newDiscounts, discountsWithoutIOIPromotion, discountsWithIOIPromotion) {
    var discountsWithoutIOIPromotionIterator = discountsWithoutIOIPromotion.iterator();
    while (discountsWithoutIOIPromotionIterator.hasNext()) {
        var discountWithoutIOIPromotion = discountsWithoutIOIPromotionIterator.next();
        if (!discountsContainPromotion(discountsWithIOIPromotion, discountWithoutIOIPromotion.getPromotion())) {
            newDiscounts.removeDiscount(discountWithoutIOIPromotion);
        }
    }
}

/**
 *  Removes shipping discounts that are in discountsWithoutIOIPromotion and not in discountsWithIOIPromotion from discountsWithoutIOIPromotion
 *
 * @param {*} basket The basket containing the shipments that have discounts
 * @param {*} discountsWithoutIOIPromotion The DiscountPlan without the OG IOI Promotion
 * @param {*} discountsWithIOIPromotion The DiscountPlan with the OG IOI Promotion
 */
function removeIncompatibleShippingDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion) {
    var shipments = basket.shipments.iterator();
    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var shippingDiscountsWithoutIOIPromotion = discountsWithoutIOIPromotion.getShippingDiscounts(shipment);
        var shippingDiscountsWithIOIPromotion = discountsWithIOIPromotion.getShippingDiscounts(shipment);
        this.removeDiscountsIncompatibleWithIOI(discountsWithoutIOIPromotion, shippingDiscountsWithoutIOIPromotion, shippingDiscountsWithIOIPromotion);
    }
}

/**
 *  Removes order discounts that are in discountsWithoutIOIPromotion and not in discountsWithIOIPromotion from discountsWithoutIOIPromotion
 *
 * @param {*} discountsWithoutIOIPromotion The DiscountPlan without the OG IOI Promotion
 * @param {*} discountsWithIOIPromotion The DiscountPlan with the OG IOI Promotion
 */
function removeIncompatibleOrderDiscounts(discountsWithoutIOIPromotion, discountsWithIOIPromotion) {
    var orderDiscountsWithIOIPromotion = discountsWithIOIPromotion.getOrderDiscounts();
    var orderDiscountsWithoutIOIPromotion = discountsWithoutIOIPromotion.getOrderDiscounts();
    this.removeDiscountsIncompatibleWithIOI(discountsWithoutIOIPromotion, orderDiscountsWithoutIOIPromotion, orderDiscountsWithIOIPromotion);
}

/**
 *  Removes product discounts that are in discountsWithoutIOIPromotion and not in discountsWithIOIPromotion from discountsWithoutIOIPromotion and applies
 *  the given OG IOI Promotion to products in applicableIOIProductLineItems
 *
 * @param {*} basket The basket containing the products that have discounts
 * @param {*} discountsWithoutIOIPromotion The DiscountPlan without the OG IOI Promotion
 * @param {*} discountsWithIOIPromotion The DiscountPlan with the OG IOI Promotion
 * @param {*} applicableIOIProductLineItems The list of products that are opted into a subscription and have the given OG IOI Promotion
 * @param {*} ioiPromotion The OG IOI Promotion to apply
 */
function removeIncompatibleProductDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, applicableIOIProductLineItems, ioiPromotion) {
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();

        var productDiscountsWithIOIPromotion = discountsWithIOIPromotion.getProductDiscounts(productLineItem);
        var productDiscountsWithoutIOIPromotion = discountsWithoutIOIPromotion.getProductDiscounts(productLineItem);

        // If the product is subscribed, we're going to mimic the discounts they had with IOI promotion
        if (applicableIOIProductLineItems.contains(productLineItem)) {
            this.applyOGIOIPromotion(discountsWithIOIPromotion, productLineItem, ioiPromotion);
            this.removeDiscountsIncompatibleWithIOI(discountsWithoutIOIPromotion, productDiscountsWithoutIOIPromotion, productDiscountsWithIOIPromotion);
        } else {
            // We're going to remove the IOI discount if it exists on the product
            this.attemptRemoveOGIOIDiscounts(discountsWithoutIOIPromotion, discountsWithIOIPromotion, productLineItem, ioiPromotion);

            // The global IOI promotion means all products have to mimic the discounts they had with
            // IOI promotion regardless of if it was applied to them, we don't need to worry about
            // class and non exclusives because they wouldn't affect the non-IOI discounts
            if (ioiPromotion.exclusivity === Promotion.EXCLUSIVITY_GLOBAL) {
                this.removeDiscountsIncompatibleWithIOI(discountsWithoutIOIPromotion, productDiscountsWithoutIOIPromotion, productDiscountsWithIOIPromotion);
            }
        }
    }
}

/**
 * Returns a DiscountPlan for the given basket without the given OG IOI Promotion enabled
 *
 * @param {*} basket The basket from which to get the DiscountPlan
 * @param {*} ioiPromotion The OG IOI Promotion to remove from the DiscountPlan
 * @returns {DiscountPlan} Returns a DiscountPlan of the basket without the OG IOI Promotion enabled
 */
function getDiscountsWithoutIOIPromotion(basket, ioiPromotion) {
    var promotionPlan = PromotionMgr.getActivePromotions();
    promotionPlan.removePromotion(ioiPromotion);
    return PromotionMgr.getDiscounts(basket, promotionPlan);
}

/**
 * Removes the OG IOI Price Adjustments from all of the products in the given basket
 *
 * @param {*} basket The basket containing the productLineItems from which the given OG IOI Price Adjustments should be removed
 */
function removeAllOGIOIPriceAdjustments(basket) {
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        this.removeOGIOIPriceAdjustments(productLineItem);
    }
}

const calculateHelpersIOI = {
    applyOGIOIDiscounts: applyOGIOIDiscounts,
    applyOGIOIPromotion: applyOGIOIPromotion,
    removeOGIOIPriceAdjustments: removeOGIOIPriceAdjustments,
    getApplicableIOIProductLineItems: getApplicableIOIProductLineItems,
    getProductOptins: getProductOptins,
    discountsContainPromotion: discountsContainPromotion,
    removeDiscountsIncompatibleWithIOI: removeDiscountsIncompatibleWithIOI,
    removeIncompatibleShippingDiscounts: removeIncompatibleShippingDiscounts,
    removeIncompatibleOrderDiscounts: removeIncompatibleOrderDiscounts,
    removeIncompatibleProductDiscounts: removeIncompatibleProductDiscounts,
    getDiscountsWithoutIOIPromotion: getDiscountsWithoutIOIPromotion,
    removeAllOGIOIPriceAdjustments: removeAllOGIOIPriceAdjustments,
    attemptRemoveOGIOIDiscounts: attemptRemoveOGIOIDiscounts
};

module.exports = calculateHelpersIOI;
