'use strict';

/**
 * @description Function to set the product for displaying Ordergroove offer
 */
var setProduct = function () {
    $('.og-offer').ready(function () {
        if (window.OG && window.OG.setProduct) {
            // Exclude modules when there is more than one on page globally
            var module = $('.og-offer').data('og-module');
            if (module !== 'sc' && module !== 'cart_flydown' && module !== 'or') {
                window.OG.setProduct({
                    id: $('#pid').val(),
                    module: module,
                    quantity: $('.pdpForm').find('input[name="Quantity"]').val()
                });
            }
        }
    });
};

/**
 * @description Function to set the quantity for the Ordergroove offer
 */
var setQuantity = function () {
    if (window.OG && window.OG.setQuantity && $(this).val() !== '' && isFinite($(this).val())) {
        window.OG.setQuantity({
            id: $('#pid').val(),
            module: $('.og-offer').data('og-module'),
            quantity: $(this).val()
        });
    }
};

/**
 * @description Function to set the product for displaying Ordergroove offer on variants
 */
var updateProduct = function () {
    if (window.OG && window.OG.setProduct) {
        window.OG.setProduct({
            id: $('#pid').val(),
            module: $('#product-content').find('.og-offer').data('og-module'),
            quantity: $('.pdpForm').find('input[name="Quantity"]').val()
        });
    }
    // Re-binding needed after AJAX in case of QV
    $('.pdpForm').on('input', 'input[name="Quantity"]', setQuantity);
};

/**
 * @description Function to update the cart for Ordergroove offer tracking
 */
var updateCart = function () {
    if (window.OG && window.OG.updateCart) {
        window.OG.updateCart({
            id: $('#pid').val(),
            module: $('#product-content').find('.og-offer').data('og-module'),
            quantity: $('.pdpForm').find('input[name="Quantity"]').val()
        });
    }
};

/**
 * @function
 * @description Binds events to given targets for Ordergroove offers
 */
module.exports = function () {
    setProduct();
    $('.pdpForm').on('input', 'input[name="Quantity"]', setQuantity);
    $('.product-detail').on('click', '.add-to-cart', updateCart);
};
module.exports.updateProduct = updateProduct;
