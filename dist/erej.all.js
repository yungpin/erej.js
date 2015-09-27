/**
 * @preserve
 *
 * Created by yungpin on 15/8/11.
 *
 * erej.js v1.1
 *
 * a personal website js library
 *
 * @author: yungping
 * @website: http://www.erej.net
 * @update: 2015-9-10 15:33:23
 */

(function (win, doc) {
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
            return (!!win.ActiveXObject || "ActiveXObject" in win);
        },

        isMobile: function () {
            return (/\bmobile\b/.test(this.agent));
        },

        kernel: function() {
            if (this.agent.indexOf('msie')!=-1 || "ActiveXObject" in win)
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
        if (erej.isErej(selector))
            return selector;

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
    erej.singleParse = function (selector, parent, isFilter) {
        function walkNodes(par, callback) {
            var ce = arguments.callee;

            if (erej.isLikeArray(par) && !erej.isHtmlElement(par)) {
                erej.each(par, function (elem) {
                    ce(elem, callback);
                })
            } else {
                erej.each(erej.toArray(par.childNodes), function (elem) {
                    if (elem.nodeType == 1) {
                        callback.call(elem, elem);
                        ce(elem, callback);
                    }
                });
            }
        }

        var s = erej.s(selector).trim();
        if (s.startWith('#')) {
            // query by id

            s = s.right(s.size()-1);
            if (s.match(/^[A-Za-z][A-Za-z0-9-_:\.]*$/)) {
                var t = doc.getElementById(s.toString());
                return t ? [t] : [];
            } else {
                throw "Invalid id of html element.";
            }
        } else if (s.startWith('.')) {
            // query by class

            s = s.right(s.size()-1);
            if (s.match(/^[A-Za-z][A-Za-z0-9-_]*$/)) {
                var res = [];

                if (parent==doc)
                    parent = doc.body;

                var filter_class = function (elem) {
                    if (elem.className) {
                        var arr = erej.s(elem.className).splits();
                        if (erej.a(arr).contain(s.toString()))
                            res.push(elem);
                    }
                };

                if (isFilter) {//if (erej.isArray(parent) || erej.isErej(parent)) {
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

            if (erej.isLikeArray(parent)) {
                var res = erej.a();
                erej.each(parent, function(elem) {
                    var arr = elem.getElementsByTagName(s.toString());
                    res = res.merge(erej.toArray(arr));
                });
                return res.toArray();
            }
            return erej.toArray(parent.getElementsByTagName(s.toString()));
        } else if (s.startWith('[') && s.endWith(']')) {
            // query by attribute

            s = s.mid(1, 1).trim();
            var m = s.toString().match(/^(\S+).*=.*"(.+)"$/);
            if (m) {
                var k = m[1];
                var v = m[2];
                var res = [];

                if (parent==doc)
                    parent = doc.body;

                var filter_attr = function (elem) {
                    if (v=="*") {
                        if(('hasAttribute' in elem) && elem.hasAttribute(k))
                            res.push(elem);
                    } else {
                        if(('getAttribute' in elem) && elem.getAttribute(k)==v)
                            res.push(elem);
                    }
                };

                if (isFilter) {//if (erej.isArray(parent) || erej.isErej(parent)) {
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
        if (!erej.isHtmlElement(parent) && !erej.isLikeArray(parent))
            parent = doc;

        if (erej.isString(selector)) {
            if (erej.s(selector).contain(['<', '>'])) {
                var d = doc.createElement('div');
                d.innerHTML = selector;
                return erej.toArray(d.childNodes);
            }  else {

                if (parent.querySelectorAll && 0) {
                    return erej.toArray(parent.querySelectorAll(selector));
                } else {
                    var reg = [];
                    reg.push('(#[A-Za-z][A-Za-z0-9-_:\\.]*)'); // id
                    reg.push('([A-Za-z][A-Za-z0-9]*)'); // tagnaem
                    reg.push('(\\.[A-Za-z][A-Za-z0-9-_]*)'); // class
                    reg.push('(\\[(([A-Za-z][A-Za-z0-9]*?)(?=).*?"(.+?)")\\])'); // attr
                    var regexp = new RegExp(reg.join('|'), 'g');

                    var parms = [];
                    var lastIndex = [];
                    while (m=regexp.exec(selector)) {
                        parms.push(m[0]);
                        lastIndex.push(regexp.lastIndex);
                    }
                    if (parms) {
                        var res = parent;
                        erej.each(parms, function (sel, i) {
                            var isFilter = (i>0 && lastIndex[i-1]+sel.length==lastIndex[i]);
                            res = erej.singleParse(sel, res, isFilter);
                        });

                        return res;
                    }
                }
            }
        } else if (erej.isObject(selector)) {
            if (erej.isHtmlElement(selector) || selector==win) {
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
            //console.log('handle guid:'+handle.guid+" type:"+handle.type);

            event = event || win.event;

            if (!event.srcElement && event.target)
                event.srcElement = event.target;

            event.proxyElement = null;//handle.elem;
            if (handle.deleage) {
                var c = erej(handle.deleage, handle.elem);
                if (c.length > 0) {
                    erej.each(c, function (elem) {
                        if (elem.contains(event.srcElement)) {
                            event.proxyElement = elem;
                            return true;
                        }
                    });
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

        addClass : function (v) {
            if (this.length == 0)
                return this;

            if (!erej.isString(v))
                return this;

            var _toAdd = erej.a(erej.s(v).splits());

            this.each(function (elem) {
                var _newClass = _toAdd.merge(erej(elem).classname()).unique();
                erej(elem).classname(_newClass.toArray().join(' '));
            });

            return this;
        },

        append : function (obj) {
            if (!erej.isDefined(obj))
                return this;
            if (erej.isString(obj))
                obj = erej(obj);

            if (erej.isErej(obj)) {
                this.each(function (elem) {
                    obj.each(function (item) {
                        elem.appendChild(item);
                    });
                });
            } else {
                this.each(function (elem) {
                    elem.appendChild(obj);
                });
            }

            return this;
        },

        appendTo : function (obj) {
            if (!erej.isObject(obj))
                return this;

            if (erej.isErej(obj)) {
                obj.append(this);
            } else {
                erej(obj).append(this);
            }

            return this;
        },

        at : function (idx) {
            return erej(this[idx]);
        },

        attr : function(k, v) {
            if (this.length == 0)
                return this;

            if (!erej.isDefined(k)) {
                return this.attrs();
            } else {
                if (erej.isDefined(v)) {
                    if (v===false) {
                        this.each(function (elem) {
                            elem.removeAttribute(k);
                        });
                    } else {
                        this.each(function (elem) {
                            elem.setAttribute(k, v);
                        });
                    }
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

        classname : function(v) {
            if (this.length == 0)
                return this;

            if (!erej.isDefined(v))
                return erej.s(this[0].className).splits();

            if (erej.isString(v))
                this.each(function (elem) {
                    elem.className = v;
                });

            return this;
        },

        css : function(k, v) {
            if (this.length == 0)
                return this;

            if (!erej.isDefined(k)) {
                return this.csss();
            } else {
                if (erej.isString(k)) {
                    if (k=="") {
                        this.each(function (elem) {
                            elem.style.cssText = "";
                        });
                        return this;
                    } else {
                        if (erej.isDefined(v)) {
                            var obj = {};
                            obj[k] = v;
                            return this.csss(obj);
                        } else {
                            return this.csss()[k];
                        }
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
                    var _css = res.join(' ');
                    this.each(function (elem) {
                        elem.style.cssText = _css;
                    });
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

        disable : function () {
            this.each(function (item) {
                item.disabled = true;
            });

            return this;
        },

        each : function(callback) {
            erej.each(this, callback);

            return this;
        },

        enable : function () {
            this.each(function (item) {
                item.disabled = false;
            });

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

        hide : function (visibility) {
            if (erej.isDefined(visibility)) {
                this.each(function (elem) {
                    elem.style.visibility = "hidden";
                });
            } else {
                this.each(function (elem) {
                    elem.style.display = "none";
                });
            }

            return this;
        },

        html : function(v) {
            if (this.length == 0)
                return this;

            if (erej.isDefined(v)) {
                this.each(function (elem) {
                    elem.innerHTML = v;
                });
                return this;
            } else {
                return this[0].innerHTML;
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

        opacity : function (v) {
            this.each(function (elem) {
                elem.style.opacity = v;
            });

            return this;
        },

        parent : function (selector) {
            if (erej.isDefined(selector)) {

            } else {
                if (this.length == 0)
                    return this;

                return erej(this[0].parentNode);
            }
        },

        remove : function () {
            this.each(function (elem) {
                elem.parentNode.removeChild(elem);
            });
            this.length = 0;
            return this;
        },

        removeClass : function (v) {
            if (this.length == 0)
                return this;

            if (!erej.isString(v))
                return this;

            var _toRm = erej.a(erej.s(v).splits());

            this.each(function (elem) {
                var _newClass = [];
                erej.each(erej(elem).classname(), function (cls) {
                    if (!_toRm.contain(cls))
                        _newClass.push(cls);
                });
                erej(elem).classname(_newClass.join(' '));
            });

            return this;
        },

        show : function (visibility) {
            if (erej.isDefined(visibility)) {
                if (visibility=="visible") {
                    this.each(function (elem) {
                        elem.style.visibility = "visible";
                    });
                } else {
                    this.each(function (elem) {
                        elem.style.display = visibility;
                    });
                }
            } else {
                this.each(function (elem) {
                    if (erej(elem).css('display')=='none')
                        erej(elem).css('display', false);
                    else
                        elem.style.display = "block";
                });
            }
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
            if (this.length == 0)
                return this;

            var t = this.attr('type');

            if (erej.isDefined(v)) {
                if (t=="radio") {
                    if (this.length>1) {
                        this.each(function (elem) {
                            if (v==elem.value) {
                                elem.checked = true;
                                return true;
                            }
                        });
                        return this;
                    }
                }

                this.each(function (elem) {
                    elem.value = v;
                });

                return this;
            } else {
                if (t=="radio") {
                    if (this.length>1) {
                        var res = "";
                        this.each(function (elem) {
                            if (elem.checked) {
                                res = elem.value;
                                return true;
                            }
                        });
                        return res;
                    }
                }
                return this[0].value;
            }
        },

        zIndex : function (v) {
            this.each(function (elem) {
                elem.style.zIndex = v;
            });

            return this;
        }
    };

    erej.type = function (obj) {
        return typeof obj;
    };

    // 遍历数组或对象，callback返回true，中断循环
    erej.each = function (arr, callback) {
        if (!erej.isObject(arr))
            return;
        if (!erej.isFunction(callback))
            return;

        if (erej.isLikeArray(arr))
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

    erej.include = function (url, type, callback) {
        var s;
        var onFileLoad = function (e) {
            //console.log("file included.")
            //console.log(e);

            if (erej.isFunction(callback))
                callback.call(this, e);
        };

        if (type == "js") {
            s = document.createElement("script");
            s.type = "text/javascript";
            s.onload = onFileLoad;
            s.src = url;
        } else if (type == "css") {
            s = document.createElement("link");
            s.rel = "stylesheet";
            s.type = "text/css";
            s.onload = onFileLoad;
            s.href = url;
            s.disabled = false;
        } else {
            return;
        }

        document.head.appendChild(s);

        return s;
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

    erej.isBool = function (obj) {
        return erej.type(obj)=="boolean";
    };

    erej.isNumber = function (obj) {
        return erej.type(obj)=="number";
    };

    erej.isLikeArray = function (obj) {
        if (!erej.isDefined(obj))
            return false;
        return erej.isNumber(obj.length);
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
        var f = function() {
            var res = [];
            erej.each(obj, function (elem) {
                res.push(elem);
            });
            return res;
        };

        try {
            if (Array.prototype.slice)
                return Array.prototype.slice.call(obj);
            else {
                return f();
            }
        } catch(e) {
            return f();
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

            erej(doc).off('DOMContentLoaded', arguments.callee);
            erej(doc).off('load', arguments.callee);
            erej(doc).off('readystatechange', arguments.callee);

            erej.each(erej_readyList, function(elem) {
                elem.call(win);
            });
        }

        if ('addEventListener' in doc) {
            // >= ie9
            erej(doc).on('DOMContentLoaded', onDomLoad);
            return;
        } else if ('attachEvent' in doc) {
            //console.log("readystatechange....");

            erej(doc).on("readystatechange", function(){
                if (doc.readyState === "complete" ) {
                    //console.log("complete....");
                    onDomLoad();
                }
            });

            if (doc.documentElement.doScroll && erej.isDefined(win.frameElement)) {
                // <= ie8
                //console.log("doscroll....");

                (function () {
                    if (erej_isReady)
                        return;
                    try {
                        doc.documentElement.doScroll("left");
                    } catch (error) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }
                    onDomLoad();
                })();
            }
            return;
        }

        //console.log("fall back....");

        erej(win).on('load', onDomLoad);
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
            });
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

        append: function (str) {
            return erej.s(this.str+str);
        },

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

        toLower : function () {
            return erej.s(this.str.toLowerCase());
        },

        toUper : function () {
            return erej.s(this.str.toUpperCase());
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
        isBlank : function () {
            return (this.trim().toString()=="");
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
            if (this.isBlank())
                return [];
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

    win.$ = win.erej = erej;

})(window, document);
/**
 * @preserve
 *
 * Created by yungpin on 15/9/10.
 *
 * erej.ajax.js v1.1
 *
 * a personal website js library
 *
 * @author: yungping
 * @website: http://www.erej.net
 * @update: 2015-9-11 12:10:48
 */

(function (win, doc) {
    if (typeof erej == "undefined") {
        alert("please import erej.js before this one");
        return;
    }

    var createAjax = function () {
        var xhr;
        try {
            xhr = new XMLHttpRequest();
            return xhr;
        } catch(e) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
                return xhr;
            } catch(e) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                    return xhr;
                } catch(e) {

                }
            }
        }
        return false;
    };

    var constructUrl = function (url, data) {
        if (!erej.isObject(data))
            return url;

        var parms = Ajax.buildUrlParms(data);

        var str = erej.s(url);
        if (str.contain("?")) {
            if (str.split("?")[1]!="" && !str.endWith("&"))
                str = str.append("&");
            return str.append(parms).toString();
        } else {
            return str.append("?").append(parms).toString();
        }
    };

    var onAjaxSuccess = function (data, status, options) {
        if (options.success) {
            options.success.call(options.ajax, data, status, options.xhr);
        }

        onAjaxComplete(status, options);
    };

    var onAjaxError = function (msg, status, options) {
        if (options.error) {
            options.error.call(options.ajax, msg, status, options.xhr);
        }

        onAjaxComplete(status, options);
    };

    var onAjaxComplete = function (status, options) {
        if (options.complete) {
            options.complete.call(options.ajax, status, options.xhr);
        }
    };

    var getAjaxHeaders = function (options) {
        var res = {};
        if (!options.xhr)
            return res;

        var headers = options.xhr.getAllResponseHeaders();
        var lines = erej.s(headers).toLower().split("\n");
        erej.each(lines, function (line) {
            if (erej.s(line).trim()!="") {
                var parts = line.split(":");
                res[parts[0]] = erej.s(parts[1]).trim().toString();
            }
        });

        return res;
    };

    var isResponseJson = function (options) {
        var headers = getAjaxHeaders(options);
        //console.log(headers);
        if (erej.s(headers['content-type']).contain('application/json'))
            return true;
        else
            return false;
    };

    var runAsAjax = function (options) {
        options.xhr = createAjax();
        if (!options.xhr) {
            onAjaxError("浏览器不支持Ajax请求", 0, options);
            return;
        }

        options.xhr.onreadystatechange = function () {
            //console.log(this);

            if (options.xhr.readyState == 4) {
                var status = options.xhr.status;
                if (isResponseJson(options)) {
                    var res = {};
                    try {
                        res = JSON.parse(options.xhr.responseText);
                    } catch(e) {
                        try {
                            res = eval("("+options.xhr.responseText+")");
                        } catch(e) {
                            onAjaxError("Invalid Json string:\n"+options.xhr.responseText, 0, options);
                            return;
                        }
                    }
                    onAjaxSuccess(res, options.xhr.status, options);
                } else {
                    onAjaxSuccess(options.xhr.responseText, options.xhr.status, options);
                }
            }
        };

        if (erej.isNumber(options.timeout) && options.timeout>0) {
            setTimeout(function () {
                if (options.xhr.readyState!=4) {
                    options.ajax.abort();
                    onAjaxError("Ajax time out", 0, options);
                }
            }, options.timeout);
        }

        if (options.type=="GET") {
            options.xhr.open(options.type, constructUrl(options.url, options.data), true);
            options.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        } else {
            options.xhr.open(options.type, options.url, true);
        }

        if (options.type=="POST") {
            var d=options.data;
            if (erej.isObject(d) && erej.isDefined(win.FormData) && !(d instanceof FormData)) {
                d = Ajax.buildUrlParms(d);
                options.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            options.xhr.send(d);
        } else {
            options.xhr.send(null);
        }

    };

    var runAsJsonp = function (options) {
        if (options.type!="GET") {
            onAjaxError("Jsonp只支持GET请求方式", 0, options);
            return;
        }

        var _script;
        var _url = constructUrl(options.url, options.data);
        var _callback = 'callback'+(Math.floor(Math.random()*1000000));

        var _resetCallback = function () {
            delete win[_callback];
            erej(_script).remove();
        };

        win[_callback] = function (data) {
            onAjaxSuccess(data, 200);
            _resetCallback();
        };

        if (erej.isNumber(options.timeout) && options.timeout>0) {
            setTimeout(function () {
                if (erej.isFunction(win[_callback])) {
                    win[_callback] = _resetCallback;

                    onAjaxError("Jsonp time out", 0, options);
                }
            }, options.timeout);
        }

        _url = constructUrl(_url, {
            "callback": _callback
        });
        _script = erej.include(_url, "js");
    };

    var Ajax = function(opts) {
        return new Ajax.init(opts);
    };

    Ajax.init = function (opts) {
        var options;
        var _self = this;

        if (!erej.isObject(opts))
            return false;

        options = {
            "type": opts.type || "GET",
            "url": opts.url,
            "data": opts.data,
            "success": erej.isFunction(opts.success) ? opts.success : null,
            "error": erej.isFunction(opts.error) ? opts.error : null,
            "complete": erej.isFunction(opts.complete) ? opts.complete : null,
            "timeout": opts.timeout,
            "jsonp": opts.jsonp
        };

        options.ajax = _self;

        if (options.jsonp) {
            runAsJsonp(options);
        } else {
            runAsAjax(options);
        }

        _self.options = options;

        return _self;
    };

    Ajax.init.prototype = {
        abort: function() {
            if (!this.options.xhr)
                return;

            try {
                this.options.xhr.abort();
            } catch(e) {}
        }
    };

    Ajax.buildUrlParms = function (parms) {
        if (!erej.isDefined(parms))
            return "";

        var _arr = [];
        for (var k in parms) {
            _arr.push(encodeURIComponent(k)+"="+encodeURIComponent(parms[k]));
        }
        return _arr.join("&");
    };

    erej.ajax = Ajax;

})(window, document);
/**
 * @preserve
 *
 * Created by yungpin on 15/9/10.
 *
 * erej.anim.js v1.1
 *
 * a personal website js library
 *
 * @author: yungping
 * @website: http://www.erej.net
 * @update: 2015-9-25 22:35:13
 */

(function (win, doc) {
    if (typeof erej == "undefined") {
        alert("please import erej.js before this one");
        return;
    }

    var requestAnimFrame = (function() {
        return  win.requestAnimationFrame   ||
            win.webkitRequestAnimationFrame ||
            win.mozRequestAnimationFrame    ||
            function(callback) {
                return win.setTimeout(callback, 1000 / 60);
            };
    })();

    var cancelAnimationFrame = (function() {
        return  win.cancelAnimationFrame   || win.cancelRequestAnimationFrame       ||
            win.webkitCancelAnimationFrame || win.webkitCancelRequestAnimationFrame ||
            win.mozCancelAnimationFrame    || win.mozCancelRequestAnimationFrame    ||
            function(id) {
                clearTimeout(id);
            };
    })();


    /*
     * t: 起始时间, 如: 0
     * d: 持续时间, 如: 3000
     * b: 初始值, 如: 0
     * c: 增量值, 如: 100
     *
     * 总得就是, 在时间[t, t+d]内, 完成 [b, b+c]的变化
     */
    var Tween = {
        Linear: function (t, b, c, d) {
            return c * t / d + b;
        },
        easeInQuad: function (t, b, c, d) {
            return c * (t /= d) * t + b;
        },
        easeOutQuad: function (t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        },
        easeInOutQuad: function (t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t + b;
            return -c / 2 * ((--t) * (t - 2) - 1) + b;
        },
        easeInCubic: function (t, b, c, d) {
            return c * (t /= d) * t * t + b;
        },
        easeOutCubic: function (t, b, c, d) {
            return c * ((t = t / d - 1) * t * t + 1) + b;
        },
        easeInOutCubic: function (t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t + 2) + b;
        },
        easeInQuart: function (t, b, c, d) {
            return c * (t /= d) * t * t * t + b;
        },
        easeOutQuart: function (t, b, c, d) {
            return -c * ((t = t / d - 1) * t * t * t - 1) + b;
        },
        easeInOutQuart: function (t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
            return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
        },
        easeInQuint: function (t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        },
        easeOutQuint: function (t, b, c, d) {
            return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },
        easeInOutQuint: function (t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        },
        easeInSine: function (t, b, c, d) {
            return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
        },
        easeOutSine: function (t, b, c, d) {
            return c * Math.sin(t / d * (Math.PI / 2)) + b;
        },
        easeInOutSine: function (t, b, c, d) {
            return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
        }        ,
        easeInExpo: function (t, b, c, d) {
            return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
        },
        easeOutExpo: function (t, b, c, d) {
            return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        },
        easeInOutExpo: function (t, b, c, d) {
            if (t == 0) return b;
            if (t == d) return b + c;
            if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (t, b, c, d) {
            return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
        },
        easeOutCirc: function (t, b, c, d) {
            return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
        },
        easeInOutCirc: function (t, b, c, d) {
            if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
            return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
        },
        easeInElastic: function (t, b, c, d, a, p) {
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (!a || a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            }
            else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        easeOutElastic: function (t, b, c, d, a, p) {
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (!a || a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            }
            else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
        },
        easeInOutElastic: function (t, b, c, d, a, p) {
            if (t == 0) return b;
            if ((t /= d / 2) == 2) return b + c;
            if (!p) p = d * (.3 * 1.5);
            if (!a || a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            }
            else var s = p / (2 * Math.PI) * Math.asin(c / a);
            if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
        },
        easeInBack: function (t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOutBack: function (t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOutBack: function (t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        },
        easeInBounce: function (t, b, c, d) {
            return c - Tween.easeOutBounce(d - t, 0, c, d) + b;
        },
        easeOutBounce: function (t, b, c, d) {
            if ((t /= d) < (1 / 2.75)) {
                return c * (7.5625 * t * t) + b;
            } else if (t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
            } else if (t < (2.5 / 2.75)) {
                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
            } else {
                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
            }
        },
        easeInOutBounce: function (t, b, c, d) {
            if (t < d / 2) return Tween.easeInBounce(t * 2, 0, c, d) * .5 + b;
            else return Tween.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
        }
    };


    var AnimFrame = function (opts) {
        return new AnimFrame.init(opts);
    };

    AnimFrame.init = function (opts) {
        var options;
        var _self = this;

        if (!erej.isObject(opts))
            return false;

        options = {
            "finish": erej.isFunction(opts.finish) ? opts.finish : null,
            "progress": erej.isFunction(opts.progress) ? opts.progress : null,
            "long": erej.isNumber(opts.long) ? opts.long : 3000,
            "type": erej.isString(opts.type) && (opts.type in Tween) ? Tween[opts.type] : Tween.Linear,
            "alive": false,
            "autoRun": erej.isBool(opts.autoRun) ? opts.autoRun : false,
            "from": erej.isNumber(opts.from) ? opts.from : 0,
            "to": erej.isNumber(opts.to) ? opts.to : 100
        };

        _self.options = options;

        if (options.autoRun)
            _self.run();

        return _self;
    };

    AnimFrame.init.prototype = {
        run: function () {
            var _self = this;

            if (_self.options.alive)
                return this;
            _self.options.alive = true;

            var t = 0, d = _self.options.long;
            var b = _self.options.from, c = _self.options.to;

            (function () {
                var f = arguments.callee;

                if (!_self.options.alive)
                    return;

                var v = _self.options.type(t, b, c, d);

                if (_self.options.progress)
                    _self.options.progress.call(_self, v);

                t += 16;

                if (t >= d) {
                    _self.options.alive = false;

                    if (_self.options.progress)
                        _self.options.progress.call(_self, b+c);

                    if (_self.options.finish)
                        _self.options.finish.call(_self, b+c);
                    return;
                }

                requestAnimFrame(f);
            })();

            return this;
        },

        stop: function() {
            this.options.alive = false;
            return this;
        },

        isRunning: function() {
            return this.options.alive;
        }
    };

    var isAnimFrame = function (aFrame) {
        return erej.isObject(aFrame) && (aFrame instanceof AnimFrame.init);
    };



    var Anim = function (opts) {
        return new Anim.init(opts);
    };

    Anim.init = function (opts) {
        var options;
        var _self = this;

        options = {
            "frames": [],
            "finish": null,
            "alive": false,
            "current": 0
        };

        if (erej.isObject(opts)) {
            options.finish = erej.isFunction(opts.finish) ? opts.finish : null;
        }

        _self.options = options;

        return _self;
    };

    Anim.init.prototype = {
        parallel: function (aFrames) {
            if (this.options.alive)
                return this;

            var res = [];
            erej.each(arguments, function (item) {
                if (isAnimFrame(item))
                    res.push(item);
            });
            this.options.frames.push(res);

            return this;
        },

        serial: function (aFrame) {
            if (this.options.alive)
                return this;

            if (isAnimFrame(aFrame))
                this.options.frames.push(aFrame);

            return this;
        },

        sleep: function (ms) {
            if (this.options.alive)
                return this;

            this.options.frames.push(AnimFrame({
                "long": ms
            }));

            return this;
        },

        run: function () {
            if (this.options.alive)
                return this;
            this.options.alive = true;
            this.options.current = 0;

            var _self = this;

            (function () {
                var f = arguments.callee;

                if (!_self.options.alive)
                    return;
                if (_self.options.current>=_self.options.frames.length) {
                    if (_self.options.finish)
                        _self.options.finish.call(_self);
                    return;
                }

                var aFrame = _self.options.frames[_self.options.current];

                if (erej.isArray(aFrame)) {
                    var oldFinishCnt = 0;
                    var oldFinishs = [];

                    erej.each(aFrame, function (frame, i) {
                        oldFinishs.push(frame.options.finish);
                        frame.options.finish = function () {
                            if (oldFinishs[i])
                                oldFinishs[i].apply(frame, arguments);

                            oldFinishCnt++;
                            if (oldFinishCnt==oldFinishs.length)
                                f.call();
                        };

                        frame.run();
                    });

                } else {
                    var oldFinish = aFrame.options.finish;
                    aFrame.options.finish = function () {
                        if (oldFinish)
                            oldFinish.apply(aFrame, arguments);

                        f.call();
                    };

                    aFrame.run();
                }


                _self.options.current++;
            })();

            return this;
        },

        stop: function () {
            this.options.alive = false;
            this.options.current = 0;

            erej.each(this.options.frames, function (frame) {
                frame.stop();
            });
        }
    };

    erej.animFrame = AnimFrame;
    erej.anim = Anim;

})(window, document);


/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 */
/**
 * @preserve
 *
 * Created by yungpin on 15/9/11.
 *
 * erej.toast.js v1.1
 *
 * a personal website js library
 *
 * @author: yungping
 * @website: http://www.erej.net
 * @update: 2015-9-11 12:12:42
 */

(function (win, doc) {
    if (typeof erej == "undefined") {
        alert("please import erej.js before this one");
        return;
    }

    var topZIndex = 1000;

    var tpl = function (msg, icon, classname) {
        var html = "";
        html += '<div class="erej-toast '+classname+'">';
        html +=   '<div class="mask"></div>';
        html +=   '<div class="wrap">';
        html +=     '<div class="content">';
        html +=       '<i class="'+icon+'"></i>';
        html +=       '<span>'+msg+'</span>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        return html;
    };

    var changeText = function (options, msg) {
        options.msg = msg;
        erej('.content span', options.elem).html(options.msg);
    };

    var createWindow = function (options) {
        var _html = tpl(options.msg, options.icon, options.classname);
        var _elem = erej(_html).hide().zIndex(topZIndex++);
        if (options.mask)
            _elem.find('.mask').show();
        else
            _elem.find('.mask').hide();
        _elem.appendTo(doc.body);

        return _elem;
    };

    var showAndHideWindow = function (options, isHide) {
        clearTimeout(options.timerDelay);
        clearTimeout(options.timerTimeout);

        if (isHide) {
            options.elem.hide();
            onToastHide(options);
        } else {
            var f = function () {
                options.elem.show();
                onToastShow(options);

                if (options.timeout) {
                    //console.log("timeout:"+options.timeout)
                    options.timerTimeout = setTimeout(function () {
                        showAndHideWindow(options, true);
                    }, options.timeout);
                }
            };

            //console.log("ddddd:"+options.delay)
            if (options.delay) {
                //console.log("delay:"+options.delay)
                options.timerDelay = setTimeout(f, options.delay);
            } else {
                f();
            }
        }
    };

    var onToastShow = function (options) {
        if (options.onshow)
            options.onshow.call(options.toast, true);
    };

    var onToastHide = function (options) {
        if (options.onhide)
            options.onhide.call(options.toast, false);
    };

    var Toast = function (opts) {
        return new Toast.init(opts);
    };

    Toast.ICON = {
        NONE: "",
        OK: "erej-icon-ok",
        ERROR: "erej-icon-error",
        INFO: "erej-icon-info",
        LOAD: "erej-icon-loading"
    };

    Toast.init = function (opts) {
        var options;
        var _self = this;

        if (!erej.isObject(opts))
            return false;

        options = {
            "msg": opts.msg || "",
            "icon": opts.icon || Toast.ICON.NONE,
            "mask": erej.isBool(opts.mask) ? opts.mask : false,
            "classname": opts.classname || "",
            "hide": erej.isBool(opts.hide) ? opts.hide : false,
            "timeout": erej.isNumber(opts.timeout) ? opts.timeout : 0, //自动关闭
            "delay": erej.isNumber(opts.delay) ? opts.delay : 0, //延迟显示
            "onshow": erej.isFunction(opts.onshow) ? opts.onshow : null,
            "onhide": erej.isFunction(opts.onhide) ? opts.onhide : null
        };

        options.toast = _self;
        options.elem = createWindow(options);
        options.timerDelay = null;
        options.timerTimeout = null;

        showAndHideWindow(options, options.hide);

        _self.options = options;

        return _self;
    };

    Toast.init.prototype = {
        show: function(msg){
            if (erej.isString(msg))
                changeText(this.options, msg);

            showAndHideWindow(this.options, false);
        },

        hide: function() {
            showAndHideWindow(this.options, true);
        }
    };

    erej.toast = Toast;

})(window, document);