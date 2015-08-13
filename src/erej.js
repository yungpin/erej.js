/**
 * Created by yungpin on 15/8/11.
 */


var erej_isBind = false;
var erej_isReady = false;
var erej_readyList = [];
var erej_eventList = {};

var erej = function(selector, parent){
    return new erej.init(selector, parent);
};

erej.fn = erej.prototype;

erej.init = function(selector, parent) {
    var _self = this;
    _self.length = 0;

    var doms = erej.select(selector, parent);
    if (doms) {
        erej.each(doms, function (elem, i) {
            _self[i] = elem;
        });
        _self.length = doms.length;
    }

    return erej.z(_self, erej.fn);
};

erej.singleParse = function (selector, parent) {
    var s = erej.s(selector).trim();
    if (s.startWith('#')) {
        // query by id

        s = s.right(s.size()-1);
        if (s.match(/^[A-Za-z][A-Za-z0-9-_:\.]*$/)) {
            return [parent.getElementById(s.toString())];
        } else {
            throw "Invalid id of html element.";
        }
    } else if (s.startWith('.')) {
        // query by class

        s = s.right(s.size()-1);
        if (s.match(/^[A-Za-z][A-Za-z0-9-_]*$/)) {
            return [];
        } else {
            throw "Invalid class name of html element.";
        }
    } else if (s.match(/^[A-Za-z][A-Za-z0-9]*$/)) {
        // query by tagname

        return [parent.getElementsByTagName(s.toString())];
    } else if (s.startWith('[') && s.endWith(']')) {
        // query by attribute

        s = s.mid(1, 1).trim();
        var m = s.toString().match(/^(.+)=.*"(.+)"$/);
        if (m) {
            var k = m[1];
            var v = m[2];
            var res = [];

            if (parent==document)
                parent = document.body;
            erej.each(parent.childNodes, function (elem) {
                if (elem.nodeType==1 && ('getAttribute' in elem) && elem.getAttribute(k)==v)
                    res.push(elem);
            });

            return res;
        } else {
            throw "Invalid format of attribute selector.";
        }
    } else {
        throw "Invalid selector.";
    }

    return [];
};

erej.select = function (selector, parent) {
    if (!erej.isHtmlElement(parent))
        parent = document;

    if (erej.isString(selector)) {
        if (erej.s(selector).contains(['<', '>'])) {
            var d = document.createElement('div');
            d.innerHTML = selector;
            return d.childNodes;
        }  else {
            return erej.singleParse(selector, parent);

            if (parent.querySelectorAll) {
                return parent.querySelectorAll(selector);
            } else {
                /*var res = [];
                erej.each(selector.split(' '), function (elem) {
                    res = erej.singleParse(elem, res.length>0 ? res[0] : parent);
                });*/
                return erej.singleParse(selector, parent);
            }
        }
    } else if (erej.isObject(selector)) {
        if (erej.isHtmlElement(selector) || selector==window) {
            return [selector];
        }
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

erej.guid = 1;

erej.event = {
    handle : function(event, handle) {
        console.log('handle guid:'+handle.guid+" type:"+handle.type);

        if (!event.srcElement && event.target)
            event.srcElement = event.target;

        event.proxyElement = handle.elem;
        if (handle.deleage) {
            var c = erej(handle.deleage, handle.elem);
            if (c.length > 0) {
                if (c[0].contains(event.srcElement))
                    event.proxyElement = c[0];
            }
        }

        handle.callback.call(handle.elem, event, handle.data);
    },

    on : function (elem, type, callback, delegate, data, capture) {
        var _self = this;
        var guid = erej.event.guid(elem);

        if (!erej.isArray(erej_eventList[guid]))
            erej_eventList[guid] = [];

        var handle = {
            'guid' : guid,
            'elem': elem,
            'type': type,
            'deleage' : delegate,
            'data' : data,
            'callback' : callback,
            'capture' : capture,
            'callbackFn' : undefined
        };

        handle.callbackFn = function (e) {
            erej.event.handle(e, handle);
        };

        erej_eventList[guid].push(handle);

        if ('addEventListener' in elem)
            elem.addEventListener(type, handle.callbackFn, capture);
        else if ('attachEvent' in elem)
            elem.attachEvent('on'+type, handle.callbackFn, capture);
        else
            elem['on'+type] = handle.callbackFn;
    },

    off : function (elem, type, callback) {
        var _self = this;
        var guid = erej.event.getGuid(elem);
        if (guid && erej_eventList[guid]) {
            erej.each(erej_eventList[guid], function (handle, i) {
                if (handle.type == type && handle.callback == callback) {
                    if ('removeEventListener' in handle.elem)
                        handle.elem.removeEventListener(handle.type, handle.callbackFn, handle.capture);
                    else if ('detachEvent' in handle.elem)
                        handle.elem.detachEvent('on'+handle.type, handle.callbackFn, handle.capture);
                    else
                        elem['on'+type] = null;

                    erej_eventList[guid].splice(i, 1);

                    return true;
                }
            });
        }
    },

    guid : function (elem) {
        return elem._eid || (elem._eid = erej.guid++);
    },

    getGuid : function (elem) {
        return elem._eid;
    }
},

erej.fn = {
    each : function(callback) {
        erej.each(this, callback);
        return this;
    },

    get : function (idx) {
        return this[idx];
    },

    // type, callback, [delegate,] [data]
    on : function (type, callback, delegate, data) {
        if (!erej.isString(type))
            return this;
        if (!erej.isFunction(callback))
            return this;

        this.each(function (elem) {
            erej.event.on(elem, type, callback, delegate, data);
        });

        return this;
    },

    off : function (type, callback) {
        if (!erej.isString(type))
            return this;

        this.each(function (elem) {
            erej.event.off(elem, type, callback);
        });

        return this;
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
    },

    find : function (selector) {
        if (this.length==0)
            return this;
        return erej(selector, this[0]);
    }
};

erej.type = function (obj) {
    return typeof obj;
};

erej.isObject = function (obj) {
    return erej.type(obj)=="object";
};

erej.isString = function (obj) {
    return erej.type(obj)=="string";
};

erej.isArray = function (obj) {
    if (!erej.isObject(obj))
        return false;
    return obj instanceof Array;
};

erej.isRegexp = function (obj) {
    if (!erej.isObject(obj))
        return false;
    return obj instanceof RegExp;
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

erej.isHtmlElement = function(obj) {
    if (!erej.isObject(obj))
        return false;
    return obj.nodeType==1 || obj.nodeType == 9;
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


erej.ready = function (callback) {
    if (erej_isReady)
        return;

    if (!erej.isFunction(callback))
        return;

    erej_readyList.push(callback);

    if (erej_isBind)
        return;
    erej_isBind = true;

    function onDomLoad() {
        if (erej_isReady)
            return;
        erej_isReady = true;

        $(document).off('DOMContentLoaded', arguments.callee);
        $(document).off('load', arguments.callee);
        $(document).off('readystatechange', arguments.callee);

        erej.each(erej_readyList, function(elem) {
            elem.call(window);
        });
    }

    if ('addEventListener' in document) {
        $(document).on('DOMContentLoaded', onDomLoad);
        return;
    } else if ('attachEvent' in document) {
        console.log("readystatechange....");

        $(document).on("readystatechange", function(){
            if (document.readyState === "complete" ) {
                console.log("complete....");
                onDomLoad();
            }
        });

        if (document.documentElement.doScroll && !erej.isDefined(window.frameElement)) {
            console.log("doscroll....");

            (function () {
                if (erej_isReady)
                    return;
                try {
                    document.documentElement.doScroll("left");
                } catch (error) {
                    setTimeout(arguments.callee, 0);
                    return;
                }
                onDomLoad();
            })();
        }
        return;
    }

    console.log("fall back....");

    $(window).on('load', onDomLoad);
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
        return erej.s(this.str.replace(/(^\s+)|(\s+$)/g, ""));
    },

    ltrim : function () {
        return erej.s(this.str.replace(/^\s+/g, ""));
    },

    rtrim : function () {
        return erej.s(this.str.replace(/\s+$/g, ""));
    },

    replaceAll : function(from, to) {
        return erej.s(this.str.replace(new RegExp(from,'g'), to));
    },

    left : function (num) {
        return erej.s(this.str.substr(0, num));
    },

    right : function (num) {
        return erej.s(this.str.substr(this.str.length-num, num));
    },

    mid : function (leftNum, rightNum) {
        return erej.s(this.str.substring(leftNum, this.str.length-rightNum));
    },

    /* -----以下方法不可续接----- */

    toString : function () {
        return this.str;
    },

    size : function () {
        return this.str.length;
    },

    split : function (str) {
        return this.str.split(str);
    },

    // 编码URI数据=PHP:rawurlencode
    encode : function (component) {
        if (component)
            return encodeURIComponent(this.str);
        else
            return encodeURI(this.str);
    },

    // 解码URI数据=PHP:rawurldecode
    decode : function (component) {
        if (component)
            return decodeURIComponent(this.str);
        else
            return decodeURI(this.str);
    },

    // 返回bool
    contain : function (key) {
        return this.str.indexOf(key)!=-1;
    },

    // 返回bool
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

    // 返回bool
    startWith : function(str) {
        return this.str.substr(0, str.length) == str;
    },

    // 返回bool
    endWith : function(str) {
        return this.str.substr(this.str.length - str.length) == str;
    },

    // 返回bool
    match : function(regexp) {
        if (!erej.isRegexp(regexp))
            return false;
        return regexp.test(this.str);
    }
};

erej.init.prototype = erej.fn;

window.$ = erej;