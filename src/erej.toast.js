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

    var topZIndex = 2000;

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
                options.elem.show('table');
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
            "onhide": erej.isFunction(opts.onhide) ? opts.onhide : null,
            "hideOnClick": erej.isBool(opts.hideOnClick) ? opts.hideOnClick : false
        };

        options.toast = _self;
        options.elem = createWindow(options);
        options.timerDelay = null;
        options.timerTimeout = null;

        erej(options.elem).on('click', function () {
            if (options.hideOnClick)
                showAndHideWindow(options, true);
        });

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