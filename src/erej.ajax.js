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