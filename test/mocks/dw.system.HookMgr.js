/**
* Represents the current site mock
*/

var HookMgr = function () {};

HookMgr.hasHook = function (hookID) {
    if (hookID !== null) {
        return true;
    }
    return true;
};

HookMgr.callHook = function (hookID) {
    if (hookID === 'ordergroove.customer') {
        return true;
    }
    return true;
};

module.exports = HookMgr;
