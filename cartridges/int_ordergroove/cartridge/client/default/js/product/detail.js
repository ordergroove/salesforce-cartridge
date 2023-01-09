'use strict';

module.exports = {
    setProduct: function () {
        if (window.OrdergrooveLegacyOffers) {
            $('.og-offer').ready(function () {
                if (window.OG && window.OG.setProduct) {
                    window.OG.setProduct({
                        id: $('.product-detail').data('pid'),
                        module: $('.og-offer').data('og-module'),
                        quantity: $('.product-detail').find('.quantity-select').val()
                    });
                }
            });
        }
    },
    updateProduct: function () {
        $('body').on('product:afterAttributeSelect', function () {
            if (window.OrdergrooveLegacyOffers) {
                if (window.OG && window.OG.setProduct) {
                    window.OG.setProduct({
                        id: $('.product-detail').data('pid'),
                        module: $('.og-offer').data('og-module'),
                        quantity: $('.product-detail').find('.quantity-select').val()
                    });
                }
            } else {
                $('og-offer').attr('product', $('.product-detail').data('pid'));
            }
        });
    },
    setQuantity: function () {
        if (window.OrdergrooveLegacyOffers) {
            $(document).on('change', '.quantity-select', function (e) {
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
    },
    updateCart: function () {
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
};
