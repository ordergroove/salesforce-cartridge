'use strict';

/**
 * Informs OG a product has been removed from the cart
 */
function removeFromCart() {
    $('body').on('click', '.cart-delete-confirmation-btn', function () {
        if (window.OG && window.OG.removeFromCart) {
            window.OG.removeFromCart({
                id: $(this).data('pid')
            }, { isAjax: true });
        }
    });
}

module.exports = {
    removeFromCart: removeFromCart(),

    updateCart: function () {
        $('body').on('change', '.quantity-form .quantity', function () {
            if (window.OG && window.OG.updateCart) {
                window.OG.updateCart({
                    id: $(this).data('pid'),
                    module: 'sc',
                    quantity: $(this).val()
                }, { isAjax: true });
            }
            removeFromCart();
        });
    }
};
