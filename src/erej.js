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

    var doms = erej.select(selector);
    if (doms) {
        erej.each(doms, function (elem, i) {
            _self[i] = elem;
        });
        _self.length = doms.length;
    }

    return erej.z(_self, erej.fn);
};

erej.select = function (selector) {
    if (erej.s(selector).contains(['<', '>'])) {
        var d = document.createElement('div');
        d.innerHTML = selector;
        return d.childNodes;
    } else {
        var doms = document.querySelectorAll ? document.querySelectorAll(selector) : [];
        return doms;
    }

    return [];
};

erej.z = function (obj, fn) {
    if (erej.isObject(obj.__proto__)) {
        var res = Array.prototype.slice.call(obj);
        res.__proto__ = fn;
        return res;
    } else {
        return obj;
    }
};

erej.fn = {
    each : function(callback) {
        erej.each(this, callback);
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

    toArray : function() {
        var res = [];
        erej.each(this, function (elem) {
            res.push(elem);
        });
        return res;
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

erej.isErej = function(obj) {
    if (!erej.isObject(obj))
        return false;
    return obj instanceof erej.init;
};

erej.isDefined = function(obj) {
    return erej.type(obj)!="undefined";
};

// 遍历数组或对象，callback返回true，中断循环
erej.each = function (arr, callback) {
    if (!erej.isObject(arr))
        return;
    if (!erej.isFunction(callback))
        return;
    if (erej.isArray(arr) || arr instanceof erej.init || arr instanceof erej.a.init) {
        for (var i = 0; i < arr.length; i++)
            if (callback.call(arr[i], arr[i], i))
                break;
    } else {
        for (var k in arr) {
            if (callback.call(arr[k], arr[k], k))
                break;
        }
    }
};




// 数组方法集
erej.a = function (arr) {
    return new erej.a.init(arr);
};

erej.a.init = function (arr) {
    var _self = this;

    this.arr = erej.isArray(arr) ? arr : [];

    this.length = 0;
    if (erej.isArray(arr)) {
        erej.each(arr, function(elem, i) {
            _self[i] = elem;
        });
        _self.length = arr.length;
    }

    return erej.z(this, erej.a.init.prototype);
};

erej.a.init.prototype = {
    contain : function (val) {
        var res = false;
        erej.each(this, function (elem) {
            if (elem == val) {
                res = true;
                return true;
            }
        });
        return res;
    },

    unique : function() {
        var res = [];
        var l = this.length;
        for (var i = 0; i < l; i++) {
            for (var j = i + 1; j < l; j++) {
                if (this[i] === this[j])
                    j = ++i;
            }
            res.push(this[i]);
        }

        erej.each(res, function (elem, i) {
            this[i] = res[i];
        });
        this.length = res.length;
        return this;
    },

    randomize : function() {
        return Array.prototype.sort.call(this, function(){
            return ((Math.random() * 3) | 0) - 1;
        });
    }
};





// 字符串方法集
erej.s = function (str) {
    return new erej.s.init(str);
};

erej.s.init = function(str) {
    this.str = str || "";
};

erej.s.init.prototype = {
    trim : function () {
        this.str = this.str.replace(/(^\s+)|(\s+$)/g, "");
        return this;
    },

    ltrim : function () {
        this.str = this.str.replace(/^\s+/g, "");
        return this;
    },

    rtrim : function () {
        this.str = this.str.replace(/\s+$/g, "");
        return this;
    },

    replaceAll : function(from, to) {
        this.str = this.str.replace(new RegExp(from,'g'), to);
        return this;
    },

    toString : function () {
        return this.str;
    },

    //编码URI数据=PHP:rawurlencode
    encode : function (component) {
        if (component)
            return encodeURIComponent(this.str);
        else
            return encodeURI(this.str);
    },

    //解码URI数据=PHP:rawurldecode
    decode : function (component) {
        if (component)
            return decodeURIComponent(this.str);
        else
            return decodeURI(this.str);
    },

    contain : function (key) {
        return this.str.indexOf(key)!=-1;
    },

    contains : function (keys) {
        var res = true;
        var _s = this;
        erej.each(keys, function(elem) {
           if (!_s.contain(elem)) {
               res = false;
               return true;
           }
        });
        return res;
    },

    startWith : function(str) {
        return this.str.substr(0, str.length) == str;
    },

    endWith : function(str) {
        return this.str.substr(this.str.length - str.length) == str;
    }
};

erej.init.prototype = erej.fn;

window.$ = erej;