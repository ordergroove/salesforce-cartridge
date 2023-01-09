var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('OrderGroove-PurchasePostTracking', function () {
    this.timeout(25000);

    var cookieJar = request.jar();

    var myRequest = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    myRequest.url = config.baseUrl + '/OrderGroove-PurchasePostTracking';

    it('should successfully call purchase post tracking', function () {
        myRequest.form = {
            tracking: '{}'
        };

        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected purchase post tracking request statusCode to be 200.');
                var bodyAsJson = JSON.parse(response.body);
                assert.ok(typeof bodyAsJson === 'object');
            });
    });
});
