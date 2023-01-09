'use strict';

/**
 * A function to call the OrderGroove-PurchasePostTracking endpoint with the current OG optins.
 */
function onOptinChanged() {
    $.ajax({
        url: window.OrdergrooveTrackingUrl,
        method: 'POST',
        data: { tracking: JSON.stringify(window.OG.getOptins()) },
        success: function () {
            // We want to trigger a quantity change event even though the quantity isn't changing
            // so that we execute the same logic that refreshes discounts when the quantity changes
            $('.quantity-form > .quantity').trigger('change');
        }
    });
}

module.exports = function () {
    if (!window.OrdergrooveLegacyOffers) {
        window.OG.addOptinChangedCallback(onOptinChanged);
    }
};
