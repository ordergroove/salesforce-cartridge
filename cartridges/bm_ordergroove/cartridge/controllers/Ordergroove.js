'use strict';

/**
 * This controller implements the business manager extension action for OrderGroove.
 *
 * @module controllers/Ordergroove
 */

exports.Dashboard = function () {
	/* Local API Includes */
    var ISML = require('dw/template/ISML');

	// Render dashboard
    ISML.renderTemplate('extensions/dashboard');
    return;
};

/* Web exposed methods */
exports.Dashboard.public = true;
