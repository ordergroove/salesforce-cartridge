var PromotionMgr = require('dw/campaign/PromotionMgr');
var calculateHelpersIOI = require('*/cartridge/scripts/hooks/cart/calculateHelpersIOI');

/**
 * Applies the OG IOI Promotion to the given basket
 *
 * @param {*} basket The basket to which the OG IOI Promotion should be applied
 */
function applyOGIOIPromotion(basket) {
    // We have to clear all the price adjustments first because they won't clear automatically
    calculateHelpersIOI.removeAllOGIOIPriceAdjustments(basket);

    var ioiPromotion = PromotionMgr.getPromotion('OrdergrooveIOI');

    if (!ioiPromotion) {
        return;
    }

    var discountsWithIOIPromotion = PromotionMgr.getDiscounts(basket);
    var discountsWithoutIOIPromotion = calculateHelpersIOI.getDiscountsWithoutIOIPromotion(basket, ioiPromotion);

    // Nothing subscribed, so we can act as if the IOI promotion didn't exist
    var applicableIOIProductLineItems = calculateHelpersIOI.getApplicableIOIProductLineItems(basket, discountsWithIOIPromotion, ioiPromotion);
    if (applicableIOIProductLineItems.length === 0) {
        PromotionMgr.applyDiscounts(discountsWithoutIOIPromotion);
        return;
    }

    // Remove Order discounts that are incompatible with IOI
    calculateHelpersIOI.removeIncompatibleOrderDiscounts(discountsWithoutIOIPromotion, discountsWithIOIPromotion);

    // Remove Shipping discounts that are incompatible with IOI
    calculateHelpersIOI.removeIncompatibleShippingDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion);

    // Remove Product discounts that are incompatible with IOI
    calculateHelpersIOI.removeIncompatibleProductDiscounts(basket, discountsWithoutIOIPromotion, discountsWithIOIPromotion, applicableIOIProductLineItems, ioiPromotion);

    PromotionMgr.applyDiscounts(discountsWithoutIOIPromotion);
}

module.exports = {
    applyOGIOIPromotion: applyOGIOIPromotion
};
