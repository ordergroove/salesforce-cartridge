'use strict';

/**
 * Copied from base cartridge
 */

module.exports = {
    pad: function (str, length) {
        return str + Array(length).join(' ');
    },
    encodeBase64: function (value) {
        return value;
    }
};
