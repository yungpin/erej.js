/**
 * Created by yungpin on 15/8/11.
 */
var erej = function(selector){
    return new erej.init(selector);
};

erej.fn = erej.prototype;

erej.init = function(selector) {
    var _self = this;
    _self.length = 0;

    var doms = document.querySelectorAll(selector);
    if (doms) {
        erej.each(doms, function (elem, i) {
            _self[i] = elem;
        });
        _self.length = doms.length;
    }

    return erej.z(_self);
};

erej.z = function (obj) {
    if (erej.isObject(obj.__proto__)) {
        var res = Array.prototype.slice.call(obj);
        res.__proto__ = erej.fn;
        return res;
    } else {
        return obj;
    }
};

erej.fn = {
    each : function(callback) {
        erej.each(this, callback, true);
    },

    get : function (idx) {
        return this[idx];
    },

    html : function(v) {
        if (erej.isDefined(v)) {
            this.each(function(elem, i) {
               elem.innerHTML = v;
            });

            return this;
        } else {
            if (this.length == 0) {
                return '';
            } else {
                return this[0].innerHTML;
            }
        }
    },

    f1 : function() {
        console.log("call f1");
    }
};

erej.type = function (obj) {
    return typeof obj;
};

erej.isObject = function (obj) {
    return erej.type(obj)=="object";
};

erej.isArray = function (obj) {
    if (!erej.isObject(obj))
        return false;
    return obj instanceof Array;
};

erej.isNodeList = function (obj) {
    if (!erej.isObject(obj))
        return false;
    return obj instanceof NodeList;
};

erej.isFunction = function(obj) {
    return erej.type(obj)=="function";
};

erej.isDefined = function(obj) {
    return erej.type(obj)!="undefined";
};

erej.each = function (arr, callback, asArray) {
    if (!erej.isObject(arr))
        return;
    if (!erej.isFunction(callback))
        return;
    if (erej.isArray(arr) || asArray) {
        for (var i = 0; i < arr.length; i++)
            callback.call(arr[i], arr[i], i);
    } else {
        for (var k in arr) {
            callback.call(arr[k], arr[k], k);
        }
    }
};

erej.init.prototype = erej.fn;

window.$ = erej;