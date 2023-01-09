'use strict';

/**
 * Informs OG a product quantity has changed
 */
function setQuantity() {
    if (window.OrdergrooveLegacyOffers) {
        $('.product-quickview').on('change', '.quantity-select', function (e) {
            e.preventDefault();
            if (window.OG && window.OG.setQuantity) {
                window.OG.setQuantity({
                    id: $('.product-detail').data('pid'),
                    module: $('.og-offer').data('og-module'),
                    quantity: $(this).val()
                });
            }
        });
    }
}

/**
 * Informs OG a product is added to the cart
 */
function updateCart() {
    if (window.OrdergrooveLegacyOffers) {
        $('body').on('product:afterAddToCart', function () {
            if (window.OG && window.OG.updateCart) {
                window.OG.updateCart({
                    id: $('.product-detail').data('pid'),
                    module: $('.og-offer').data('og-module'),
                    quantity: $('.product-detail').find('.quantity-select').val()
                });
            }
        });
    }
}

/**
 * Informs OG a product view has changed via variant attribute selection
 */
function updateProduct() {
    $('body').on('product:afterAttributeSelect', function () {
        if (window.OrdergrooveLegacyOffers) {
            if (window.OG && window.OG.setProduct) {
                window.OG.setProduct({
                    id: $(this).find('.product-quickview').data('pid'),
                    module: $(this).find('.product-quickview .og-offer').data('og-module'),
                    quantity: $(this).find('.product-quickview .quantity-select').val()
                });
            }
            setQuantity();
            updateCart();
        } else {
            $('og-offer').attr('product', $('.product-detail').data('pid'));
        }
    });
}

module.exports = {
    setProduct: function () {
        $('body').on('quickview:ready', function () {
            if (window.OrdergrooveLegacyOffers) {
                if (window.OG && window.OG.setProduct) {
                    window.OG.setProduct({
                        id: $(this).find('.product-quickview').data('pid'),
                        module: $(this).find('.product-quickview .og-offer').data('og-module'),
                        quantity: $(this).find('.product-quickview .quantity-select').val()
                    });
                }
                setQuantity();
                updateCart();
            }
            updateProduct();
        });
    }
};
