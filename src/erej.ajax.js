/**
 * Created by erej on 2015/9/10 0010.
 */

(function (win, doc) {
    if (typeof erej == "undefined") {
        alert("please import erej.js before this one");
        return;
    }

    var xmlhttp;
    var options;
    var _self;

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

    var onAjaxSuccess = function (data, status) {
        if (erej.isFunction(options.success)) {
            options.success.call(_self, data, status, xmlhttp);
        }

        onAjaxComplete(status);
    };

    var onAjaxError = function (msg, status) {
        if (erej.isFunction(options.error)) {
            options.error.call(_self, msg, status, xmlhttp);
        }

        onAjaxComplete(status);
    };

    var onAjaxComplete = function (status) {
        if (erej.isFunction(options.complete)) {
            options.complete.call(_self, status, xmlhttp);
        }
    };

    var getAjaxHeaders = function () {
        var res = {};
        if (!xmlhttp)
            return res;

        var headers = xmlhttp.getAllResponseHeaders();
        var lines = erej.s(headers).toLower().split("\n");
        erej.each(lines, function (line) {
            if (erej.s(line).trim()!="") {
                var parts = line.split(":");
                res[parts[0]] = erej.s(parts[1]).trim().toString();
            }
        });

        return res;
    };

    var isResponseJson = function () {
        var headers = getAjaxHeaders();
        //console.log(headers);
        if (erej.s(headers['content-type']).contain('application/json'))
            return true;
        else
            return false;
    };

    var runAsAjax = function () {
        xmlhttp = createAjax();
        if (!xmlhttp) {
            onAjaxError("浏览器不支持Ajax请求", 0);
            return;
        }

        xmlhttp.onreadystatechange = function () {
            //console.log(this);

            if (xmlhttp.readyState == 4) {
                var status = xmlhttp.status;
                if (isResponseJson()) {
                    var res = {};
                    try {
                        res = JSON.parse(xmlhttp.responseText);
                    } catch(e) {
                        try {
                            res = eval("("+xmlhttp.responseText+")");
                        } catch(e) {
                            onAjaxError("Invalid Json string:\n"+xmlhttp.responseText, 0);
                            return;
                        }
                    }
                    onAjaxSuccess(res, xmlhttp.status);
                } else {
                    onAjaxSuccess(xmlhttp.responseText, xmlhttp.status);
                }
            }
        };

        if (erej.isNumber(options.timeout) && options.timeout>0) {
            setTimeout(function () {
                if (xmlhttp.readyState!=4) {
                    _self.abort();
                    onAjaxError("Ajax time out", 0);
                }
            }, options.timeout);
        }

        if (options.type=="GET") {
            xmlhttp.open(options.type, constructUrl(options.url, options.data), true);
            xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        } else {
            xmlhttp.open(options.type, options.url, true);
        }
        xmlhttp.send(options.type=="POST" ? options.data : null);
    };

    var runAsJsonp = function () {
        if (options.type!="GET") {
            onAjaxError("Jsonp只支持GET请求方式", 0);
            return;
        }

        var _script;
        var _url = constructUrl(options.url, options.data);
        var _callback = 'callback'+(Math.floor(Math.random()*1000000));

        var _resetCallback = function () {
            delete window[_callback];
            $(_script).remove();
        };

        window[_callback] = function (data) {
            onAjaxSuccess(data, 200);
            _resetCallback();
        };

        if (erej.isNumber(options.timeout) && options.timeout>0) {
            setTimeout(function () {
                if (erej.isFunction(window[_callback])) {
                    window[_callback] = _resetCallback;

                    onAjaxError("Jsonp time out", 0);
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
        _self = this;

        options = {
            "type": opts.type || "GET",
            "url": opts.url,
            "data": opts.data,
            "success": opts.success,
            "error": opts.error,
            "complete": opts.complete,
            "timeout": opts.timeout,
            "jsonp": opts.jsonp
        };

        if (options.jsonp) {
            runAsJsonp();
        } else {
            runAsAjax();
        }
    };

    Ajax.init.prototype = {
        abort: function() {
            if (!xmlhttp)
                return;

            try {
                xmlhttp.abort();
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