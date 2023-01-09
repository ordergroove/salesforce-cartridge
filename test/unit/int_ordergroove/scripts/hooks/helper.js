'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = require('../../../../mocks/dw.system.Site');
var Logger = require('../../../../mocks/dw.system.Logger');
var Encoding = require('../../../../mocks/dw.crypto.Encoding');
var Mac = require('../../../../mocks/dw.crypto.Mac');
var Cipher = require('../../../../mocks/dw.crypto.Cipher');
var Bytes = require('../../../../mocks/dw.util.Bytes');
var Calendar = require('../../../../mocks/dw.util.Calendar');
var StringUtils = require('../../../../mocks/dw.util.StringUtils');

const customerId = 'testCustomerId';
const timeStamp = 123;
const signature = 'testCustomerId|123';
const auth = {
    sig: signature,
    sig_field: customerId,
    ts: timeStamp
};

global.empty = (val) => {
    return val === null || val === 'undefined';
};

describe('helper hook', function () {
    var helper = proxyquire('../../../../../cartridges/int_ordergroove/cartridge/scripts/hooks/helper', {
        'dw/system/Site': Site,
        'dw/system/Logger': Logger,
        'dw/crypto/Encoding': Encoding,
        'dw/util/Calendar': Calendar,
        'dw/crypto/Mac': Mac,
        'dw/crypto/WeakCipher': Cipher,
        'dw/util/Bytes': Bytes,
        'dw/util/StringUtils': StringUtils
    });

    describe('verify', function () {
        it('should return true for valid signature', function () {
            var verification = helper.verify(customerId, JSON.stringify(auth));
            assert.equal(verification, true);
        });

        it('should return false for invalid signature', function () {
            const badAuth = {
                sig: 'badSignature',
                sig_field: customerId,
                ts: 123
            };
            var verification = helper.verify(customerId, JSON.stringify(badAuth));
            assert.equal(verification, false);
        });

        it('should return false for non number timestamp', function () {
            const badAuth = {
                sig: 'testCustomerId|123',
                sig_field: customerId,
                ts: 'badTimestamp'
            };
            var verification = helper.verify(customerId, JSON.stringify(badAuth));
            assert.equal(verification, false);
        });

        it('should return false for null timestamp', function () {
            const badAuth = {
                sig: 'testCustomerId|123',
                sig_field: customerId,
                ts: null
            };
            var verification = helper.verify(customerId, JSON.stringify(badAuth));
            assert.equal(verification, false);
        });

        it('should return false for null customer', function () {
            var verification = helper.verify(null, JSON.stringify(auth));
            assert.equal(verification, false);
        });

        it('should return false for non string customer', function () {
            var verification = helper.verify(123, JSON.stringify(auth));
            assert.equal(verification, false);
        });

        it('should return false for null auth', function () {
            var verification = helper.verify(customerId, null);
            assert.equal(verification, false);
        });

        it('should return false for non string auth', function () {
            var verification = helper.verify(customerId, {});
            assert.equal(verification, false);
        });
    });

    describe('signature', function () {
        it('should valid signature', function () {
            var sig = helper.signature(customerId, timeStamp);
            assert.equal(sig.signature, 'testCustomerId|123');
            assert.equal(sig.timestamp, 123);
        });

        it('should return empty string for null customer', function () {
            var sig = helper.signature(null, timeStamp);
            assert.equal(sig, '');
        });
    });

    describe('cipher', function () {
        it('should cipher and decipher', function () {
            const plainText = 'testString';
            const encryptedText = helper.cipher(plainText);
            const decryptedText = helper.decipher(encryptedText);
            assert.equal(plainText, decryptedText);
        });
    });
});
