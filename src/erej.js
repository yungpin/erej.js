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
                return 'Chrome';
            else if (this.agent.indexOf('firefox/')!=-1)
                return 'Firefox';
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
                return 'Android';
            else if (this.agent.indexOf('mac os')!=-1)
                return 'IOS';
            else if (this.agent.indexOf('windows phone')!=-1)
                return 'WP';
            else if (this.agent.indexOf('symbianos')!=-1)
                return 'Symbian';
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
                erej.each(erej.toArray(par ? par.childNodes : []), function (elem) {
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
                    if ('getElementsByTagName' in elem) {
                        var arr = elem.getElementsByTagName(s.toString());
                        res = res.merge(erej.toArray(arr));
                    }
                });
                return res.toArray();
            }
            if ('getElementsByTagName' in parent)
                return erej.toArray(parent.getElementsByTagName(s.toString()));
            else
                return [];
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

        //return [];
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
                    var m;
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
                    erej.each(erej_eventList[guid], function (handle) {
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
            //var _self = this;
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
            //var _self = this;
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
    };

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
                            if (elem.style)
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
                        if (elem.style)
                            elem.style.cssText = _css;
                    });
                }
                return this;
            } else {
                var res = {};
                if (this[0].style) {
                    var s = this[0].style.cssText.split(/\s*;\s*/);

                    erej.each(s, function(elem) {
                        var a = elem.split(/\s*:\s*/);
                        if (a.length == 2) {
                            res[a[0]] = a[1];
                        }
                    });
                }

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
                    if (elem.style)
                        elem.style.visibility = "hidden";
                });
            } else {
                this.each(function (elem) {
                    if (elem.style)
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
                if (elem.style)
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
                        if (elem.style)
                            elem.style.visibility = "visible";
                    });
                } else {
                    this.each(function (elem) {
                        if (elem.style)
                            elem.style.display = visibility;
                    });
                }
            } else {
                this.each(function (elem) {
                    if (erej(elem).css('display')=='none') {
                        erej(elem).css('display', false);
                    } else {
                        if (elem.style)
                            elem.style.display = "block";
                    }
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
                    this.each(function (elem) {
                        if (v==elem.value) {
                            elem.checked = true;
                            return true;
                        }
                    });
                    return this;
                } else if (t=="checkbox") {
                    if (erej.isArray(v)) {
                        var a = erej.a(v);
                        this.each(function (elem) {
                            if (a.contain(elem.value)) {
                                elem.checked = true;
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
                    var res = "";
                    this.each(function (elem) {
                        if (elem.checked) {
                            res = elem.value;
                            return true;
                        }
                    });
                    return res;
                } else if (t=="checkbox") {
                    var res = [];
                    this.each(function (elem) {
                        if (elem.checked) {
                            res.push(elem.value);
                        }
                    });
                    return res;
                }
                return this[0].value;
            }
        },

        zIndex : function (v) {
            this.each(function (elem) {
                if (elem.style)
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
        if (erej_isReady) {
            if (erej.isFunction(callback))
                callback.call(win);
            return;
        }

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

        //this.arr = erej.isArray(arr) ? arr : [];

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