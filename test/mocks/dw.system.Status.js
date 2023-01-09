/* eslint-disable */
var _list = function (arr) {
    arr.get = function (index) {
        return arr[index];
    };
    return arr;
};

var StatusItem = function(status){
    this.status  = typeof status  !== "undefined" ? status  : null;
    this.details = {};
    this.setStatus = function(statusItem) {
        this.status = statusItem;
    };
    this.addDetail = function(key, value) {
        this.details[key] = value;
    };
};

var Status = function(status, code, message) {
//    this.status  = typeof status  !== "undefined" ? status  : null;
    this.code    = typeof code    !== "undefined" ? code    : null;
    this.message = typeof message !== "undefined" ? message : null;
    this.items   = _list([ new StatusItem(status) ]);
    this.parameters=null;
    this.detail  = null;
    this.ff = 4;
    this.getItems = function(){
        return this.items;
    };
    Object.defineProperty(this, 'status', {
        get: function() {
            let globalStatus = 0;
            this.items.forEach(statusItem => {
                if (statusItem.status !== 0) {
                    globalStatus = statusItem.status;
                }
            });
            return globalStatus;
        }
    });
};

module.exports = Status;
Status.OK    = 0;
Status.ERROR = 1;