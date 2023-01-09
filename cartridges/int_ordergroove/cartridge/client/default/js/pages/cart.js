'use strict';

/**
 * @private
 * @function
 * @description Function to remove a line item product for Ordergroove offer tracking
 */
function removeFromCart() {
    if (window.OG && window.OG.removeFromCart) {
        window.OG.removeFromCart({
            id: $(this).closest('.cart-row').find('.og-offer').data('og-product')
        }, { isAjax: false });
    }
}

/**
 * @private
 * @function
 * @param {string} qty - the quantity
 * @description Function to update a line item product for Ordergroove offer tracking
 */
function updateCart(qty) {
    if (window.OG && window.OG.updateCart) {
        window.OG.updateCart({
            id: $(qty).closest('.cart-row').find('.og-offer').data('og-product'),
            module: 'sc',
            quantity: $(qty).val()
        }, { isAjax: false });
    }
}

/**
 * @function
 * @description Binds events to given targets for Ordergroove tracking
 */
module.exports = function () {
    $('button[name$="deleteProduct"]').on('click', removeFromCart);
    $('form input[name$="_quantity"]').on('keydown', function (e) {
        if (e.which === 13 && $(this).val().length > 0) {
            updateCart($(this));
        }
    });
};
