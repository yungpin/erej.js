/**
 * Created by yungpin on 15/8/11.
 */


var erej_isBind = false;
var erej_isReady = false;
var erej_readyList = [];
var erej_eventList = {};
var erej_guid = 1;

var erej = function(selector, parent){
    return new erej.init(selector, parent);
};

erej.fn = erej.prototype;

erej.browser = {
    agent: navigator.userAgent.toLowerCase(),

    isIE: function () {
        return (!!window.ActiveXObject || "ActiveXObject" in window);
    },

    isMobile: function () {
        return (/\bmobile\b/.test(this.agent));
    },

    kernel: function() {
        if (this.agent.indexOf('msie')!=-1 || "ActiveXObject" in window)
            return 'IE';
        else if (this.agent.indexOf('chrome/')!=-1)
            return 'Chrome'
        else if (this.agent.indexOf('firefox/')!=-1)
            return 'Firefox'
        else if (this.agent.indexOf('safari/')!=-1 && this.agent.indexOf('version/')!=-1)
            return 'Safari';
        else if (this.agent.indexOf('opera/')!=-1 && this.agent.indexOf('version/')!=-1)
            return 'Opera';
        return 'unknown';
    },

    os: function() {
        if (this.agent.indexOf('windows nt')!=-1)
            return 'Windows';
        else if (/android[\s|\/]/.test(this.agent))
            return 'Android'
        else if (this.agent.indexOf('mac os')!=-1)
            return 'IOS'
        else if (this.agent.indexOf('windows phone')!=-1)
            return 'WP'
        else if (this.agent.indexOf('symbianos')!=-1)
            return 'Symbian'
        return 'unknown';
    },

    osVer: function () {
        var k = this.os();
        switch (k) {
            case 'Windows':
                return (/windows nt\s([^;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
            case 'Android':
                return (/android[\/|\s]([^\s|;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
            case 'IOS': {
                if (/os\s+([^\s]+)\s+like/ig.test(this.agent))
                    return RegExp.$1;
                if (/mac\s+os\s+x\s+([^\s|\)]+)/ig.test(this.agent))
                    return RegExp.$1;
                return 0;
            }
            case 'WP':
                return (/windows phone\s([^;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
            case 'Symbian':
                return (/symbianos\/([^\s|;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
        }
        return 0;
    },

    ver: function () {
        var k = this.kernel();
        switch (k) {
            case 'IE': {
                if (/msie\s([^\s|;]+)/ig.test(this.agent))
                    return RegExp.$1;
                else if (/trident.*rv:([^\)]+)/ig.test(this.agent))
                    return RegExp.$1;
                return 0;
            }
            case 'Chrome':
                return (/chrome\/([^\s|;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
            case 'Firefox':
                return (/firefox\/([^\s|;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
            case 'Safari':
            case 'Opera':
                return (/version\/([^\s|;]+)/ig.test(this.agent) ? RegExp.$1 : 0);
        }
        return 0;
    }
};

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

    return erej.pack(_self, erej.fn);
};

// 始终返回数组
erej.singleParse = function (selector, parent) {
    function walkNodes(par, callback) {
        var ce = arguments.callee;

        erej.each(par.childNodes, function (elem) {
            if (elem.nodeType == 1) {
                callback.call(elem, elem);
                ce(elem, callback);
            }
        });
    }

    var s = erej.s(selector).trim();
    if (s.startWith('#')) {
        // query by id

        s = s.right(s.size()-1);
        if (s.match(/^[A-Za-z][A-Za-z0-9-_:\.]*$/)) {
            return [document.getElementById(s.toString())];
        } else {
            throw "Invalid id of html element.";
        }
    } else if (s.startWith('.')) {
        // query by class

        s = s.right(s.size()-1);
        if (s.match(/^[A-Za-z][A-Za-z0-9-_]*$/)) {
            var res = [];

            if (parent==document)
                parent = document.body;

            function filter_class(elem) {
                if (elem.className) {
                    var arr = erej.s(elem.className).splits();
                    if (erej.a(arr).contain(s.toString()))
                        res.push(elem);
                }
            }

            if (erej.isArray(parent) || erej.isErej(parent)) {
                erej.each(parent, filter_class);
            } else {
                walkNodes(parent, filter_class);
            }

            return res;
        } else {
            throw "Invalid class name of html element.";
        }
    } else if (s.match(/^[A-Za-z][A-Za-z0-9]*$/)) {
        // query by tagname

        if (erej.isArray(parent) || erej.isErej(parent)) {
            var res = erej.a();
            erej.each(parent, function(elem) {
                var arr = elem.getElementsByTagName(s.toString());
                res.merge(erej.toArray(arr));
            });
            return res.toArray();
        }
        return erej.toArray(parent.getElementsByTagName(s.toString()));
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

            function filter_attr(elem) {
                if(('getAttribute' in elem) && elem.getAttribute(k)==v)
                    res.push(elem);
            }

            if (erej.isArray(parent) || erej.isErej(parent)) {
                erej.each(parent, filter_attr);
            } else {
                walkNodes(parent, filter_attr);
            }

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
        if (erej.s(selector).contain(['<', '>'])) {
            var d = document.createElement('div');
            d.innerHTML = selector;
            return d.childNodes;
        }  else {
            
            if (parent.querySelectorAll && 0) {
                return parent.querySelectorAll(selector);
            } else {
            	var reg = [];
                reg.push('(#[A-Za-z][A-Za-z0-9-_:\\.]*)'); // id
                reg.push('([A-Za-z][A-Za-z0-9]*)'); // tagnaem
                reg.push('(\\.[A-Za-z][A-Za-z0-9-_]*)'); // class
                reg.push('(\\[(([A-Za-z][A-Za-z0-9]*?)(?=).*?"(.+?)")\\])'); // attr
                var regexp = new RegExp(reg.join('|'), 'g');

                var m = selector.match(regexp);
                if (m) {
                    //console.log(m);

                    var res = parent;
                    erej.each(m, function (sel) {
                        res = erej.singleParse(sel, res);
                    });

                    return res;
                }
            }
        }
    } else if (erej.isObject(selector)) {
        if (erej.isHtmlElement(selector) || selector==window) {
            return [selector];
        }
    }

    return [];
};

erej.pack = function (obj, fn) {
    if (erej.isObject(obj.__proto__)) {
        var res = Array.prototype.slice.call(obj);
        res.__proto__ = fn;
        return res;
    } else {
        return obj;
    }
};

erej.event = {

    fire : function (elem, type) {
        var _self = this;
        var stopBuble = false;
        var srcElement = elem;

        while (elem && stopBuble==false) {
            var guid = erej.event.getGuid(elem);

            if (guid && erej_eventList[guid]) {
                erej.each(erej_eventList[guid], function (handle, i) {
                    if (handle.type == type) {
                        var event = {
                            'srcElement': srcElement,
                            'type': handle.type,
                            'preventDefault': function () {},
                            'returnValue': true, // for IE
                            'stopPropagation': function () {
                                stopBuble = true;
                            },
                            'cancelBubble': false // for IE
                        };
                        _self.handle(event, handle);

                        if (event.cancelBubble)
                            stopBuble = event.cancelBubble;
                    }
                });
            }

            elem = elem.parentNode;
        }
    },

    guid : function (elem) {
        return elem._eid || (elem._eid = erej_guid++);
    },

    getGuid : function (elem) {
        return elem._eid;
    },

    handle : function(event, handle) {
        console.log('handle guid:'+handle.guid+" type:"+handle.type);

        event = event || window.event;

        if (!event.srcElement && event.target)
            event.srcElement = event.target;

        event.proxyElement = null;//handle.elem;
        if (handle.deleage) {
            var c = erej(handle.deleage, handle.elem);
            if (c.length > 0) {
                if (c[0].contains(event.srcElement))
                    event.proxyElement = c[0];
            }
        }

        handle.callback.call(handle.elem, event, handle.data);
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
    }
},

erej.fn = {
    
    attr : function(k, v) {
    	if (this.length == 0)
    		return this;
    	
    	if (!erej.isDefined(k)) {
    		return this.attrs();
    	} else {
    		if (erej.isDefined(v)) {
    			if (v===false)
            		this[0].removeAttribute(k);
            	else
            		this[0].setAttribute(k, v);

                return this;
            } else {
                return this[0].getAttribute(k);
            }
    	}
    },
    
    attrs : function(obj) {
    	if (this.length == 0)
    		return this;
    	
    	if (erej.isDefined(obj)) {
    		var _self = this;
    		// obj is k-v object
    		if (erej.isObject(obj)) {
    			erej.each(obj, function(val, key) {
    				_self.attr(key, val);
    			});
    		}
    		return this;
    	} else {
    		var res = {};
    		erej.each(this[0].attributes, function(elem) {
    			// attribute's nodeType==2
    			if (erej.isObject(elem) && elem.nodeType==2) {
    				res[elem.name] = elem.value;
    			}
    		});
    		return res;
    	}
    },
    
    classname : function(k, override) {
    	if (this.length == 0)
    		return this;
    	
    	if (!erej.isDefined(k)) {
    		return erej.s(this[0].className).splits();
    	} else {
    		var _self = this;
    		
    		if (erej.isString(k)) {
    			if (override) {
    				this[0].className = k;
    			} else {
    				var c = _self.classname();
        			var keys = erej.s(k).splits();
        			erej.each(keys, function(key) {
       					c.push(key);
        			});
        			this[0].className = erej.a(c).unique().toArray().join(' ');
    			}
    		}
    		return this;
    	}
    },
    
    css : function(k, v) {
    	if (this.length == 0)
    		return this;
    	
    	if (!erej.isDefined(k)) {
    		return this.csss();
    	} else {
    		if (erej.isString(k)) {
    			if (k=="") {
    				this[0].style.cssText = "";
    				return this;
    			} else {
    				var obj = {};
	    			obj[k] = v;
	    			return this.csss(obj);
    			}
    		} else {
    			return this.csss(k);
    		}
    	}
    },
    
    csss : function(obj) {
    	if (this.length == 0)
    		return this;
    	
    	if (erej.isDefined(obj)) {
    		var _self = this;
    		// obj is k-v object
    		if (erej.isObject(obj)) {
    			var old = _self.csss();
    			erej.each(obj, function(val, key) {
    				if (val===false)
    					delete old[key];
    				else
    					old[key] = val;
    			});
    			
    			var res = [];
    			erej.each(old, function(val, key) {
    				res.push(key+":"+val+";");
    			});
    			this[0].style.cssText = res.join(' ');
    		}
    		return this;
    	} else {
    		var s = this[0].style.cssText.split(/\s*;\s*/);
    		var res = {};
    		erej.each(s, function(elem) {
    			var a = elem.split(/\s*:\s*/);
    			if (a.length == 2) {
    				res[a[0]] = a[1];
    			}
    		});
    		return res;
    	}
    },
    
    data : function(k, v) {
    	if (this.length == 0)
    		return this;
    	
    	if (!erej.isDefined(k)) {
    		return this.datas();
    	} else {
    		if (erej.isString(k)) {
    			return this.attr("data-"+k, v);
    		} else {
    			return this.datas(k);
    		}
    	}
    },
    
    datas : function(obj) {
    	if (this.length == 0)
    		return this;
    	
    	if (erej.isDefined(obj)) {
    		var _self = this;
    		// obj is k-v object
    		if (erej.isObject(obj)) {
    			erej.each(obj, function(val, key) {
    				_self.attr('data-'+key, val);
    			});
    		}
    		return this;
    	} else {
    		var res = {};
    		erej.each(this.attrs(), function(val, key) {
    			key = erej.s(key);
				if (key.startWith('data-'))
					res[key.right(key.size()-5)] = val;
    		});
    		return res;
    	}
    },
    
    each : function(callback) {
        erej.each(this, callback);
        return this;
    },
    
    find : function (selector) {
        if (this.length==0)
            return this;
        return erej(selector, this);
    },

    fire : function (type) {
        if (!erej.isString(type))
            return this;

        this.each(function (elem) {
            erej.event.fire(elem, type);
        });

        return this;
    },
    
    get : function (idx) {
        return this[idx];
    },

    hasClass : function (classname) {
        if (this.length == 0)
            return this;

        var c = erej.a(this.classname());
        return c.contain(classname);
    },

    html : function(v) {
        if (erej.isDefined(v)) {
        	if (this.length>0)
            	this[0].innerHTML = v;
            
            return this;
        } else {
            if (this.length == 0) {
                return '';
            } else {
                return this[0].innerHTML;
            }
        }
    },

    is : function (tag) {
        if (this.length == 0)
            return this;
        return this.tag()==tag;
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
    
    tag : function() {
    	if (this.length == 0)
    		return this;
    	
    	return this[0].tagName.toLowerCase();
    },
    
    toArray : function() {
        return erej.toArray(this);
    },
    
    val : function(v) {
        if (erej.isDefined(v)) {
        	if (this.length>0)
        		this[0].value = v;

            return this;
        } else {
            if (this.length == 0) {
                return '';
            } else {
                return this[0].value;
            }
        }
    }
};

erej.type = function (obj) {
    return typeof obj;
};


// 遍历数组或对象，callback返回true，中断循环
erej.each = function (arr, callback, asArray) {
    if (!erej.isObject(arr))
        return;
    if (!erej.isFunction(callback))
        return;
    if (erej.isArray(arr) || erej.isErej(arr) || erej.isErejArray(arr)
        || (asArray && erej.isDefined(arr.length)))
    {
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



erej.isObject = function (obj) {
	// safari regard NodeList as function
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

erej.isLikeArray = function (obj) {
    if (!erej.isObject(obj))
        return false;
    return erej.isDefined(obj.length);
};

erej.isRegexp = function (obj) {
    if (!erej.isDefined(obj))
        return false;
    return obj instanceof RegExp;
};

erej.isNodeList = function (obj) {
    if (!erej.isDefined(obj) || typeof NodeList == "undefined")
        return false;
    return obj instanceof NodeList;
};

erej.isFunction = function(obj) {
    return erej.type(obj)=="function";
};

erej.isErej = function(obj) {
    if (!erej.isDefined(obj))
        return false;
    return obj instanceof erej.init;
};

erej.isErejArray = function(obj) {
    if (!erej.isDefined(obj))
        return false;
    return obj instanceof erej.a.init;
};

erej.isHtmlElement = function(obj) {
    if (!erej.isObject(obj))
        return false;
    // element:1 document:9
    return obj.nodeType==1 || obj.nodeType == 9;
};

erej.isDefined = function(obj) {
    return erej.type(obj)!="undefined";
};

erej.toArray = function (obj) {
    if (Array.prototype.slice)
        return Array.prototype.slice.call(obj);
    else {
        var res = [];
        erej.each(obj, function (elem) {
            res.push(elem);
        }, true);
        return res;
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
        // >= ie9
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

        if (document.documentElement.doScroll && erej.isDefined(window.frameElement)) {
            // <= ie8
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

    return erej.pack(this, erej.a.init.prototype);
};

erej.a.init.prototype = {

    merge : function (arr) {
        if (!erej.isLikeArray(arr))
            return this;

        var res = this.toArray();
        erej.each(arr, function (elem) {
            res.push(elem);
        }, true);
        return erej.a(res);
    },

    push : function (elem) {
        this[this.length++] = elem;
        return this;
    },

    randomize : function() {
        var res = this.toArray();
        return Array.prototype.sort.call(res, function(){
            return ((Math.random() * 3) | 0) - 1;
        });
        return erej.a(res);
    },

    remove : function (idx) {
    	if (idx>=0 && idx < this.length) {
    		for (var i=idx; i<this.length; i++)
    			this[i] = this[i+1];
    		delete this[this.length];
    		this.length--;
    	}
    	return this;
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

        return erej.a(res);
    },

    /* -----以下方法不可续接----- */

    contain : function (val) {
        if (erej.isArray(val)) {
            var res = true;
            var _self = this;
            erej.each(val, function (elem) {
                if (!_self.contain(elem)) {
                    res = false;
                    return true;
                }
            });
            return res;
        } else {
            return this.indexOf(val)!=-1;
        }
    },
    
    indexOf : function (val) {
    	var res = -1;
        erej.each(this, function (elem, i) {
            if (elem == val) {
                res = i;
                return true;
            }
        });
        return res;
    },

    toArray : function () {
        return erej.toArray(this);
    }
};





// 字符串方法集
erej.s = function (str) {
    return new erej.s.init(str);
};

erej.s.init = function(str) {
    this.str = erej.isString(str) ? str : "";
};

erej.s.init.prototype = {

    left : function (num) {
        return erej.s(this.str.substr(0, num));
    },

    ltrim : function () {
        return erej.s(this.str.replace(/^\s+/g, ""));
    },

    mid : function (leftNum, rightNum) {
        return erej.s(this.str.substring(leftNum, this.str.length-rightNum));
    },

    replaceAll : function(from, to) {
        return erej.s(this.str.replace(new RegExp(from,'g'), to));
    },

    right : function (num) {
        return erej.s(this.str.substr(this.str.length-num, num));
    },

    rtrim : function () {
        return erej.s(this.str.replace(/\s+$/g, ""));
    },

    trim : function () {
        return erej.s(this.str.replace(/(^\s+)|(\s+$)/g, ""));
    },

    /* -----以下方法不可续接----- */


    // 返回bool
    contain : function (key) {
        if (erej.isArray(key)) {
            var res = true;
            var _self = this;
            erej.each(key, function(elem) {
                if (!_self.contain(elem)) {
                    res = false;
                    return true;
                }
            });
            return res;
        } else {
            return this.str.indexOf(key)!=-1;
        }
    },

    // 解码URI数据=PHP:rawurldecode
    decode : function (component) {
        if (component)
            return decodeURIComponent(this.str);
        else
            return decodeURI(this.str);
    },

    // 编码URI数据=PHP:rawurlencode
    encode : function (component) {
        if (component)
            return encodeURIComponent(this.str);
        else
            return encodeURI(this.str);
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
    },

    size : function () {
        return this.str.length;
    },

    split : function (str) {
        return this.str.split(str);
    },

    splits : function () {
        return this.trim().str.split(/\s+/);
    },

    // 返回bool
    startWith : function(str) {
        return this.str.substr(0, str.length) == str;
    },

    toString : function () {
        return this.str;
    }

};

erej.init.prototype = erej.fn;

window.$ = erej;
