(function(window) {
    var slice = Array.prototype.slice;
    function noop() {}
    function defineBridget($) {
        if (!$) {
            return;
        }
        function addOptionMethod(PluginClass) {
            if (PluginClass.prototype.option) {
                return;
            }
            PluginClass.prototype.option = function(opts) {
                if (!$.isPlainObject(opts)) {
                    return;
                }
                this.options = $.extend(true, this.options, opts);
            };
        }
        var logError = typeof console === "undefined" ? noop : function(message) {
            console.error(message);
        };
        function bridge(namespace, PluginClass) {
            $.fn[namespace] = function(options) {
                if (typeof options === "string") {
                    var args = slice.call(arguments, 1);
                    for (var i = 0, len = this.length; i < len; i++) {
                        var elem = this[i];
                        var instance = $.data(elem, namespace);
                        if (!instance) {
                            logError("cannot call methods on " + namespace + " prior to initialization; " + "attempted to call '" + options + "'");
                            continue;
                        }
                        if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
                            logError("no such method '" + options + "' for " + namespace + " instance");
                            continue;
                        }
                        var returnValue = instance[options].apply(instance, args);
                        if (returnValue !== undefined) {
                            return returnValue;
                        }
                    }
                    return this;
                } else {
                    return this.each(function() {
                        var instance = $.data(this, namespace);
                        if (instance) {
                            instance.option(options);
                            instance._init();
                        } else {
                            instance = new PluginClass(this, options);
                            $.data(this, namespace, instance);
                        }
                    });
                }
            };
        }
        $.bridget = function(namespace, PluginClass) {
            addOptionMethod(PluginClass);
            bridge(namespace, PluginClass);
        };
        return $.bridget;
    }
    if (typeof define === "function" && define.amd) {
        define("jquery-bridget/jquery.bridget", [ "jquery" ], defineBridget);
    } else {
        defineBridget(window.jQuery);
    }
})(window);

(function(window) {
    var docElem = document.documentElement;
    var bind = function() {};
    function getIEEvent(obj) {
        var event = window.event;
        event.target = event.target || event.srcElement || obj;
        return event;
    }
    if (docElem.addEventListener) {
        bind = function(obj, type, fn) {
            obj.addEventListener(type, fn, false);
        };
    } else if (docElem.attachEvent) {
        bind = function(obj, type, fn) {
            obj[type + fn] = fn.handleEvent ? function() {
                var event = getIEEvent(obj);
                fn.handleEvent.call(fn, event);
            } : function() {
                var event = getIEEvent(obj);
                fn.call(obj, event);
            };
            obj.attachEvent("on" + type, obj[type + fn]);
        };
    }
    var unbind = function() {};
    if (docElem.removeEventListener) {
        unbind = function(obj, type, fn) {
            obj.removeEventListener(type, fn, false);
        };
    } else if (docElem.detachEvent) {
        unbind = function(obj, type, fn) {
            obj.detachEvent("on" + type, obj[type + fn]);
            try {
                delete obj[type + fn];
            } catch (err) {
                obj[type + fn] = undefined;
            }
        };
    }
    var eventie = {
        bind: bind,
        unbind: unbind
    };
    if (typeof define === "function" && define.amd) {
        define("eventie/eventie", eventie);
    } else if (typeof exports === "object") {
        module.exports = eventie;
    } else {
        window.eventie = eventie;
    }
})(this);

(function(window) {
    var document = window.document;
    var queue = [];
    function docReady(fn) {
        if (typeof fn !== "function") {
            return;
        }
        if (docReady.isReady) {
            fn();
        } else {
            queue.push(fn);
        }
    }
    docReady.isReady = false;
    function init(event) {
        var isIE8NotReady = event.type === "readystatechange" && document.readyState !== "complete";
        if (docReady.isReady || isIE8NotReady) {
            return;
        }
        docReady.isReady = true;
        for (var i = 0, len = queue.length; i < len; i++) {
            var fn = queue[i];
            fn();
        }
    }
    function defineDocReady(eventie) {
        eventie.bind(document, "DOMContentLoaded", init);
        eventie.bind(document, "readystatechange", init);
        eventie.bind(window, "load", init);
        return docReady;
    }
    if (typeof define === "function" && define.amd) {
        docReady.isReady = typeof requirejs === "function";
        define("doc-ready/doc-ready", [ "eventie/eventie" ], defineDocReady);
    } else {
        window.docReady = defineDocReady(window.eventie);
    }
})(this);

(function() {
    function EventEmitter() {}
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }
        return -1;
    }
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        } else {
            response = events[evt] || (events[evt] = []);
        }
        return response;
    };
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;
        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }
        return flatListeners;
    };
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;
        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }
        return response || listeners;
    };
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === "object";
        var key;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }
        return this;
    };
    proto.on = alias("addListener");
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };
    proto.once = alias("addOnceListener");
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);
                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }
        return this;
    };
    proto.off = alias("removeListener");
    proto.addListeners = function addListeners(evt, listeners) {
        return this.manipulateListeners(false, evt, listeners);
    };
    proto.removeListeners = function removeListeners(evt, listeners) {
        return this.manipulateListeners(true, evt, listeners);
    };
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;
        if (typeof evt === "object" && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    if (typeof value === "function") {
                        single.call(this, i, value);
                    } else {
                        multiple.call(this, i, value);
                    }
                }
            }
        } else {
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }
        return this;
    };
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;
        if (type === "string") {
            delete events[evt];
        } else if (evt instanceof RegExp) {
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        } else {
            delete this._events;
        }
        return this;
    };
    proto.removeAllListeners = alias("removeEvent");
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;
        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;
                while (i--) {
                    listener = listeners[key][i];
                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }
                    response = listener.listener.apply(this, args || []);
                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }
        return this;
    };
    proto.trigger = alias("emitEvent");
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty("_onceReturnValue")) {
            return this._onceReturnValue;
        } else {
            return true;
        }
    };
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };
    if (typeof define === "function" && define.amd) {
        define("eventEmitter/EventEmitter", [], function() {
            return EventEmitter;
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = EventEmitter;
    } else {
        this.EventEmitter = EventEmitter;
    }
}).call(this);

(function(window) {
    var prefixes = "Webkit Moz ms Ms O".split(" ");
    var docElemStyle = document.documentElement.style;
    function getStyleProperty(propName) {
        if (!propName) {
            return;
        }
        if (typeof docElemStyle[propName] === "string") {
            return propName;
        }
        propName = propName.charAt(0).toUpperCase() + propName.slice(1);
        var prefixed;
        for (var i = 0, len = prefixes.length; i < len; i++) {
            prefixed = prefixes[i] + propName;
            if (typeof docElemStyle[prefixed] === "string") {
                return prefixed;
            }
        }
    }
    if (typeof define === "function" && define.amd) {
        define("get-style-property/get-style-property", [], function() {
            return getStyleProperty;
        });
    } else if (typeof exports === "object") {
        module.exports = getStyleProperty;
    } else {
        window.getStyleProperty = getStyleProperty;
    }
})(window);

(function(window, undefined) {
    var getComputedStyle = window.getComputedStyle;
    var getStyle = getComputedStyle ? function(elem) {
        return getComputedStyle(elem, null);
    } : function(elem) {
        return elem.currentStyle;
    };
    function getStyleSize(value) {
        var num = parseFloat(value);
        var isValid = value.indexOf("%") === -1 && !isNaN(num);
        return isValid && num;
    }
    var measurements = [ "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth" ];
    function getZeroSize() {
        var size = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        };
        for (var i = 0, len = measurements.length; i < len; i++) {
            var measurement = measurements[i];
            size[measurement] = 0;
        }
        return size;
    }
    function defineGetSize(getStyleProperty) {
        var boxSizingProp = getStyleProperty("boxSizing");
        var isBoxSizeOuter;
        (function() {
            if (!boxSizingProp) {
                return;
            }
            var div = document.createElement("div");
            div.style.width = "200px";
            div.style.padding = "1px 2px 3px 4px";
            div.style.borderStyle = "solid";
            div.style.borderWidth = "1px 2px 3px 4px";
            div.style[boxSizingProp] = "border-box";
            var body = document.body || document.documentElement;
            body.appendChild(div);
            var style = getStyle(div);
            isBoxSizeOuter = getStyleSize(style.width) === 200;
            body.removeChild(div);
        })();
        function getSize(elem) {
            if (typeof elem === "string") {
                elem = document.querySelector(elem);
            }
            if (!elem || typeof elem !== "object" || !elem.nodeType) {
                return;
            }
            var style = getStyle(elem);
            if (style.display === "none") {
                return getZeroSize();
            }
            var size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;
            var isBorderBox = size.isBorderBox = !!(boxSizingProp && style[boxSizingProp] && style[boxSizingProp] === "border-box");
            for (var i = 0, len = measurements.length; i < len; i++) {
                var measurement = measurements[i];
                var value = style[measurement];
                value = mungeNonPixel(elem, value);
                var num = parseFloat(value);
                size[measurement] = !isNaN(num) ? num : 0;
            }
            var paddingWidth = size.paddingLeft + size.paddingRight;
            var paddingHeight = size.paddingTop + size.paddingBottom;
            var marginWidth = size.marginLeft + size.marginRight;
            var marginHeight = size.marginTop + size.marginBottom;
            var borderWidth = size.borderLeftWidth + size.borderRightWidth;
            var borderHeight = size.borderTopWidth + size.borderBottomWidth;
            var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;
            var styleWidth = getStyleSize(style.width);
            if (styleWidth !== false) {
                size.width = styleWidth + (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
            }
            var styleHeight = getStyleSize(style.height);
            if (styleHeight !== false) {
                size.height = styleHeight + (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
            }
            size.innerWidth = size.width - (paddingWidth + borderWidth);
            size.innerHeight = size.height - (paddingHeight + borderHeight);
            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;
            return size;
        }
        function mungeNonPixel(elem, value) {
            if (getComputedStyle || value.indexOf("%") === -1) {
                return value;
            }
            var style = elem.style;
            var left = style.left;
            var rs = elem.runtimeStyle;
            var rsLeft = rs && rs.left;
            if (rsLeft) {
                rs.left = elem.currentStyle.left;
            }
            style.left = value;
            value = style.pixelLeft;
            style.left = left;
            if (rsLeft) {
                rs.left = rsLeft;
            }
            return value;
        }
        return getSize;
    }
    if (typeof define === "function" && define.amd) {
        define("get-size/get-size", [ "get-style-property/get-style-property" ], defineGetSize);
    } else if (typeof exports === "object") {
        module.exports = defineGetSize(require("get-style-property"));
    } else {
        window.getSize = defineGetSize(window.getStyleProperty);
    }
})(window);

(function(global, ElemProto) {
    var matchesMethod = function() {
        if (ElemProto.matchesSelector) {
            return "matchesSelector";
        }
        var prefixes = [ "webkit", "moz", "ms", "o" ];
        for (var i = 0, len = prefixes.length; i < len; i++) {
            var prefix = prefixes[i];
            var method = prefix + "MatchesSelector";
            if (ElemProto[method]) {
                return method;
            }
        }
    }();
    function match(elem, selector) {
        return elem[matchesMethod](selector);
    }
    function checkParent(elem) {
        if (elem.parentNode) {
            return;
        }
        var fragment = document.createDocumentFragment();
        fragment.appendChild(elem);
    }
    function query(elem, selector) {
        checkParent(elem);
        var elems = elem.parentNode.querySelectorAll(selector);
        for (var i = 0, len = elems.length; i < len; i++) {
            if (elems[i] === elem) {
                return true;
            }
        }
        return false;
    }
    function matchChild(elem, selector) {
        checkParent(elem);
        return match(elem, selector);
    }
    var matchesSelector;
    if (matchesMethod) {
        var div = document.createElement("div");
        var supportsOrphans = match(div, "div");
        matchesSelector = supportsOrphans ? match : matchChild;
    } else {
        matchesSelector = query;
    }
    if (typeof define === "function" && define.amd) {
        define("matches-selector/matches-selector", [], function() {
            return matchesSelector;
        });
    } else {
        window.matchesSelector = matchesSelector;
    }
})(this, Element.prototype);

(function(window) {
    var getComputedStyle = window.getComputedStyle;
    var getStyle = getComputedStyle ? function(elem) {
        return getComputedStyle(elem, null);
    } : function(elem) {
        return elem.currentStyle;
    };
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }
    function isEmptyObj(obj) {
        for (var prop in obj) {
            return false;
        }
        prop = null;
        return true;
    }
    function toDash(str) {
        return str.replace(/([A-Z])/g, function($1) {
            return "-" + $1.toLowerCase();
        });
    }
    function outlayerItemDefinition(EventEmitter, getSize, getStyleProperty) {
        var transitionProperty = getStyleProperty("transition");
        var transformProperty = getStyleProperty("transform");
        var supportsCSS3 = transitionProperty && transformProperty;
        var is3d = !!getStyleProperty("perspective");
        var transitionEndEvent = {
            WebkitTransition: "webkitTransitionEnd",
            MozTransition: "transitionend",
            OTransition: "otransitionend",
            transition: "transitionend"
        }[transitionProperty];
        var prefixableProperties = [ "transform", "transition", "transitionDuration", "transitionProperty" ];
        var vendorProperties = function() {
            var cache = {};
            for (var i = 0, len = prefixableProperties.length; i < len; i++) {
                var prop = prefixableProperties[i];
                var supportedProp = getStyleProperty(prop);
                if (supportedProp && supportedProp !== prop) {
                    cache[prop] = supportedProp;
                }
            }
            return cache;
        }();
        function Item(element, layout) {
            if (!element) {
                return;
            }
            this.element = element;
            this.layout = layout;
            this.position = {
                x: 0,
                y: 0
            };
            this._create();
        }
        extend(Item.prototype, EventEmitter.prototype);
        Item.prototype._create = function() {
            this._transn = {
                ingProperties: {},
                clean: {},
                onEnd: {}
            };
            this.css({
                position: "absolute"
            });
        };
        Item.prototype.handleEvent = function(event) {
            var method = "on" + event.type;
            if (this[method]) {
                this[method](event);
            }
        };
        Item.prototype.getSize = function() {
            this.size = getSize(this.element);
        };
        Item.prototype.css = function(style) {
            var elemStyle = this.element.style;
            for (var prop in style) {
                var supportedProp = vendorProperties[prop] || prop;
                elemStyle[supportedProp] = style[prop];
            }
        };
        Item.prototype.getPosition = function() {
            var style = getStyle(this.element);
            var layoutOptions = this.layout.options;
            var isOriginLeft = layoutOptions.isOriginLeft;
            var isOriginTop = layoutOptions.isOriginTop;
            var x = parseInt(style[isOriginLeft ? "left" : "right"], 10);
            var y = parseInt(style[isOriginTop ? "top" : "bottom"], 10);
            x = isNaN(x) ? 0 : x;
            y = isNaN(y) ? 0 : y;
            var layoutSize = this.layout.size;
            x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
            y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;
            this.position.x = x;
            this.position.y = y;
        };
        Item.prototype.layoutPosition = function() {
            var layoutSize = this.layout.size;
            var layoutOptions = this.layout.options;
            var style = {};
            if (layoutOptions.isOriginLeft) {
                style.left = this.position.x + layoutSize.paddingLeft + "px";
                style.right = "";
            } else {
                style.right = this.position.x + layoutSize.paddingRight + "px";
                style.left = "";
            }
            if (layoutOptions.isOriginTop) {
                style.top = this.position.y + layoutSize.paddingTop + "px";
                style.bottom = "";
            } else {
                style.bottom = this.position.y + layoutSize.paddingBottom + "px";
                style.top = "";
            }
            this.css(style);
            this.emitEvent("layout", [ this ]);
        };
        var translate = is3d ? function(x, y) {
            return "translate3d(" + x + "px, " + y + "px, 0)";
        } : function(x, y) {
            return "translate(" + x + "px, " + y + "px)";
        };
        Item.prototype._transitionTo = function(x, y) {
            this.getPosition();
            var curX = this.position.x;
            var curY = this.position.y;
            var compareX = parseInt(x, 10);
            var compareY = parseInt(y, 10);
            var didNotMove = compareX === this.position.x && compareY === this.position.y;
            this.setPosition(x, y);
            if (didNotMove && !this.isTransitioning) {
                this.layoutPosition();
                return;
            }
            var transX = x - curX;
            var transY = y - curY;
            var transitionStyle = {};
            var layoutOptions = this.layout.options;
            transX = layoutOptions.isOriginLeft ? transX : -transX;
            transY = layoutOptions.isOriginTop ? transY : -transY;
            transitionStyle.transform = translate(transX, transY);
            this.transition({
                to: transitionStyle,
                onTransitionEnd: {
                    transform: this.layoutPosition
                },
                isCleaning: true
            });
        };
        Item.prototype.goTo = function(x, y) {
            this.setPosition(x, y);
            this.layoutPosition();
        };
        Item.prototype.moveTo = supportsCSS3 ? Item.prototype._transitionTo : Item.prototype.goTo;
        Item.prototype.setPosition = function(x, y) {
            this.position.x = parseInt(x, 10);
            this.position.y = parseInt(y, 10);
        };
        Item.prototype._nonTransition = function(args) {
            this.css(args.to);
            if (args.isCleaning) {
                this._removeStyles(args.to);
            }
            for (var prop in args.onTransitionEnd) {
                args.onTransitionEnd[prop].call(this);
            }
        };
        Item.prototype._transition = function(args) {
            if (!parseFloat(this.layout.options.transitionDuration)) {
                this._nonTransition(args);
                return;
            }
            var _transition = this._transn;
            for (var prop in args.onTransitionEnd) {
                _transition.onEnd[prop] = args.onTransitionEnd[prop];
            }
            for (prop in args.to) {
                _transition.ingProperties[prop] = true;
                if (args.isCleaning) {
                    _transition.clean[prop] = true;
                }
            }
            if (args.from) {
                this.css(args.from);
                var h = this.element.offsetHeight;
                h = null;
            }
            this.enableTransition(args.to);
            this.css(args.to);
            this.isTransitioning = true;
        };
        var itemTransitionProperties = transformProperty && toDash(transformProperty) + ",opacity";
        Item.prototype.enableTransition = function() {
            if (this.isTransitioning) {
                return;
            }
            this.css({
                transitionProperty: itemTransitionProperties,
                transitionDuration: this.layout.options.transitionDuration
            });
            this.element.addEventListener(transitionEndEvent, this, false);
        };
        Item.prototype.transition = Item.prototype[transitionProperty ? "_transition" : "_nonTransition"];
        Item.prototype.onwebkitTransitionEnd = function(event) {
            this.ontransitionend(event);
        };
        Item.prototype.onotransitionend = function(event) {
            this.ontransitionend(event);
        };
        var dashedVendorProperties = {
            "-webkit-transform": "transform",
            "-moz-transform": "transform",
            "-o-transform": "transform"
        };
        Item.prototype.ontransitionend = function(event) {
            if (event.target !== this.element) {
                return;
            }
            var _transition = this._transn;
            var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;
            delete _transition.ingProperties[propertyName];
            if (isEmptyObj(_transition.ingProperties)) {
                this.disableTransition();
            }
            if (propertyName in _transition.clean) {
                this.element.style[event.propertyName] = "";
                delete _transition.clean[propertyName];
            }
            if (propertyName in _transition.onEnd) {
                var onTransitionEnd = _transition.onEnd[propertyName];
                onTransitionEnd.call(this);
                delete _transition.onEnd[propertyName];
            }
            this.emitEvent("transitionEnd", [ this ]);
        };
        Item.prototype.disableTransition = function() {
            this.removeTransitionStyles();
            this.element.removeEventListener(transitionEndEvent, this, false);
            this.isTransitioning = false;
        };
        Item.prototype._removeStyles = function(style) {
            var cleanStyle = {};
            for (var prop in style) {
                cleanStyle[prop] = "";
            }
            this.css(cleanStyle);
        };
        var cleanTransitionStyle = {
            transitionProperty: "",
            transitionDuration: ""
        };
        Item.prototype.removeTransitionStyles = function() {
            this.css(cleanTransitionStyle);
        };
        Item.prototype.removeElem = function() {
            this.element.parentNode.removeChild(this.element);
            this.emitEvent("remove", [ this ]);
        };
        Item.prototype.remove = function() {
            if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
                this.removeElem();
                return;
            }
            var _this = this;
            this.on("transitionEnd", function() {
                _this.removeElem();
                return true;
            });
            this.hide();
        };
        Item.prototype.reveal = function() {
            delete this.isHidden;
            this.css({
                display: ""
            });
            var options = this.layout.options;
            this.transition({
                from: options.hiddenStyle,
                to: options.visibleStyle,
                isCleaning: true
            });
        };
        Item.prototype.hide = function() {
            this.isHidden = true;
            this.css({
                display: ""
            });
            var options = this.layout.options;
            this.transition({
                from: options.visibleStyle,
                to: options.hiddenStyle,
                isCleaning: true,
                onTransitionEnd: {
                    opacity: function() {
                        if (this.isHidden) {
                            this.css({
                                display: "none"
                            });
                        }
                    }
                }
            });
        };
        Item.prototype.destroy = function() {
            this.css({
                position: "",
                left: "",
                right: "",
                top: "",
                bottom: "",
                transition: "",
                transform: ""
            });
        };
        return Item;
    }
    if (typeof define === "function" && define.amd) {
        define("outlayer/item", [ "eventEmitter/EventEmitter", "get-size/get-size", "get-style-property/get-style-property" ], outlayerItemDefinition);
    } else {
        window.Outlayer = {};
        window.Outlayer.Item = outlayerItemDefinition(window.EventEmitter, window.getSize, window.getStyleProperty);
    }
})(window);

(function(window) {
    var document = window.document;
    var console = window.console;
    var jQuery = window.jQuery;
    var noop = function() {};
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }
    var objToString = Object.prototype.toString;
    function isArray(obj) {
        return objToString.call(obj) === "[object Array]";
    }
    function makeArray(obj) {
        var ary = [];
        if (isArray(obj)) {
            ary = obj;
        } else if (obj && typeof obj.length === "number") {
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            ary.push(obj);
        }
        return ary;
    }
    var isElement = typeof HTMLElement === "object" ? function isElementDOM2(obj) {
        return obj instanceof HTMLElement;
    } : function isElementQuirky(obj) {
        return obj && typeof obj === "object" && obj.nodeType === 1 && typeof obj.nodeName === "string";
    };
    var indexOf = Array.prototype.indexOf ? function(ary, obj) {
        return ary.indexOf(obj);
    } : function(ary, obj) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (ary[i] === obj) {
                return i;
            }
        }
        return -1;
    };
    function removeFrom(obj, ary) {
        var index = indexOf(ary, obj);
        if (index !== -1) {
            ary.splice(index, 1);
        }
    }
    function toDashed(str) {
        return str.replace(/(.)([A-Z])/g, function(match, $1, $2) {
            return $1 + "-" + $2;
        }).toLowerCase();
    }
    function outlayerDefinition(eventie, docReady, EventEmitter, getSize, matchesSelector, Item) {
        var GUID = 0;
        var instances = {};
        function Outlayer(element, options) {
            if (typeof element === "string") {
                element = document.querySelector(element);
            }
            if (!element || !isElement(element)) {
                if (console) {
                    console.error("Bad " + this.constructor.namespace + " element: " + element);
                }
                return;
            }
            this.element = element;
            this.options = extend({}, this.constructor.defaults);
            this.option(options);
            var id = ++GUID;
            this.element.outlayerGUID = id;
            instances[id] = this;
            this._create();
            if (this.options.isInitLayout) {
                this.layout();
            }
        }
        Outlayer.namespace = "outlayer";
        Outlayer.Item = Item;
        Outlayer.defaults = {
            containerStyle: {
                position: "relative"
            },
            isInitLayout: true,
            isOriginLeft: true,
            isOriginTop: true,
            isResizeBound: true,
            isResizingContainer: true,
            transitionDuration: "0.4s",
            hiddenStyle: {
                opacity: 0,
                transform: "scale(0.001)"
            },
            visibleStyle: {
                opacity: 1,
                transform: "scale(1)"
            }
        };
        extend(Outlayer.prototype, EventEmitter.prototype);
        Outlayer.prototype.option = function(opts) {
            extend(this.options, opts);
        };
        Outlayer.prototype._create = function() {
            this.reloadItems();
            this.stamps = [];
            this.stamp(this.options.stamp);
            extend(this.element.style, this.options.containerStyle);
            if (this.options.isResizeBound) {
                this.bindResize();
            }
        };
        Outlayer.prototype.reloadItems = function() {
            this.items = this._itemize(this.element.children);
        };
        Outlayer.prototype._itemize = function(elems) {
            var itemElems = this._filterFindItemElements(elems);
            var Item = this.constructor.Item;
            var items = [];
            for (var i = 0, len = itemElems.length; i < len; i++) {
                var elem = itemElems[i];
                var item = new Item(elem, this);
                items.push(item);
            }
            return items;
        };
        Outlayer.prototype._filterFindItemElements = function(elems) {
            elems = makeArray(elems);
            var itemSelector = this.options.itemSelector;
            var itemElems = [];
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                if (!isElement(elem)) {
                    continue;
                }
                if (itemSelector) {
                    if (matchesSelector(elem, itemSelector)) {
                        itemElems.push(elem);
                    }
                    var childElems = elem.querySelectorAll(itemSelector);
                    for (var j = 0, jLen = childElems.length; j < jLen; j++) {
                        itemElems.push(childElems[j]);
                    }
                } else {
                    itemElems.push(elem);
                }
            }
            return itemElems;
        };
        Outlayer.prototype.getItemElements = function() {
            var elems = [];
            for (var i = 0, len = this.items.length; i < len; i++) {
                elems.push(this.items[i].element);
            }
            return elems;
        };
        Outlayer.prototype.layout = function() {
            this._resetLayout();
            this._manageStamps();
            var isInstant = this.options.isLayoutInstant !== undefined ? this.options.isLayoutInstant : !this._isLayoutInited;
            this.layoutItems(this.items, isInstant);
            this._isLayoutInited = true;
        };
        Outlayer.prototype._init = Outlayer.prototype.layout;
        Outlayer.prototype._resetLayout = function() {
            this.getSize();
        };
        Outlayer.prototype.getSize = function() {
            this.size = getSize(this.element);
        };
        Outlayer.prototype._getMeasurement = function(measurement, size) {
            var option = this.options[measurement];
            var elem;
            if (!option) {
                this[measurement] = 0;
            } else {
                if (typeof option === "string") {
                    elem = this.element.querySelector(option);
                } else if (isElement(option)) {
                    elem = option;
                }
                this[measurement] = elem ? getSize(elem)[size] : option;
            }
        };
        Outlayer.prototype.layoutItems = function(items, isInstant) {
            items = this._getItemsForLayout(items);
            this._layoutItems(items, isInstant);
            this._postLayout();
        };
        Outlayer.prototype._getItemsForLayout = function(items) {
            var layoutItems = [];
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                if (!item.isIgnored) {
                    layoutItems.push(item);
                }
            }
            return layoutItems;
        };
        Outlayer.prototype._layoutItems = function(items, isInstant) {
            var _this = this;
            function onItemsLayout() {
                _this.emitEvent("layoutComplete", [ _this, items ]);
            }
            if (!items || !items.length) {
                onItemsLayout();
                return;
            }
            this._itemsOn(items, "layout", onItemsLayout);
            var queue = [];
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                var position = this._getItemLayoutPosition(item);
                position.item = item;
                position.isInstant = isInstant || item.isLayoutInstant;
                queue.push(position);
            }
            this._processLayoutQueue(queue);
        };
        Outlayer.prototype._getItemLayoutPosition = function() {
            return {
                x: 0,
                y: 0
            };
        };
        Outlayer.prototype._processLayoutQueue = function(queue) {
            for (var i = 0, len = queue.length; i < len; i++) {
                var obj = queue[i];
                this._positionItem(obj.item, obj.x, obj.y, obj.isInstant);
            }
        };
        Outlayer.prototype._positionItem = function(item, x, y, isInstant) {
            if (isInstant) {
                item.goTo(x, y);
            } else {
                item.moveTo(x, y);
            }
        };
        Outlayer.prototype._postLayout = function() {
            this.resizeContainer();
        };
        Outlayer.prototype.resizeContainer = function() {
            if (!this.options.isResizingContainer) {
                return;
            }
            var size = this._getContainerSize();
            if (size) {
                this._setContainerMeasure(size.width, true);
                this._setContainerMeasure(size.height, false);
            }
        };
        Outlayer.prototype._getContainerSize = noop;
        Outlayer.prototype._setContainerMeasure = function(measure, isWidth) {
            if (measure === undefined) {
                return;
            }
            var elemSize = this.size;
            if (elemSize.isBorderBox) {
                measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
            }
            measure = Math.max(measure, 0);
            this.element.style[isWidth ? "width" : "height"] = measure + "px";
        };
        Outlayer.prototype._itemsOn = function(items, eventName, callback) {
            var doneCount = 0;
            var count = items.length;
            var _this = this;
            function tick() {
                doneCount++;
                if (doneCount === count) {
                    callback.call(_this);
                }
                return true;
            }
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                item.on(eventName, tick);
            }
        };
        Outlayer.prototype.ignore = function(elem) {
            var item = this.getItem(elem);
            if (item) {
                item.isIgnored = true;
            }
        };
        Outlayer.prototype.unignore = function(elem) {
            var item = this.getItem(elem);
            if (item) {
                delete item.isIgnored;
            }
        };
        Outlayer.prototype.stamp = function(elems) {
            elems = this._find(elems);
            if (!elems) {
                return;
            }
            this.stamps = this.stamps.concat(elems);
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                this.ignore(elem);
            }
        };
        Outlayer.prototype.unstamp = function(elems) {
            elems = this._find(elems);
            if (!elems) {
                return;
            }
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                removeFrom(elem, this.stamps);
                this.unignore(elem);
            }
        };
        Outlayer.prototype._find = function(elems) {
            if (!elems) {
                return;
            }
            if (typeof elems === "string") {
                elems = this.element.querySelectorAll(elems);
            }
            elems = makeArray(elems);
            return elems;
        };
        Outlayer.prototype._manageStamps = function() {
            if (!this.stamps || !this.stamps.length) {
                return;
            }
            this._getBoundingRect();
            for (var i = 0, len = this.stamps.length; i < len; i++) {
                var stamp = this.stamps[i];
                this._manageStamp(stamp);
            }
        };
        Outlayer.prototype._getBoundingRect = function() {
            var boundingRect = this.element.getBoundingClientRect();
            var size = this.size;
            this._boundingRect = {
                left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
                top: boundingRect.top + size.paddingTop + size.borderTopWidth,
                right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
                bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
            };
        };
        Outlayer.prototype._manageStamp = noop;
        Outlayer.prototype._getElementOffset = function(elem) {
            var boundingRect = elem.getBoundingClientRect();
            var thisRect = this._boundingRect;
            var size = getSize(elem);
            var offset = {
                left: boundingRect.left - thisRect.left - size.marginLeft,
                top: boundingRect.top - thisRect.top - size.marginTop,
                right: thisRect.right - boundingRect.right - size.marginRight,
                bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
            };
            return offset;
        };
        Outlayer.prototype.handleEvent = function(event) {
            var method = "on" + event.type;
            if (this[method]) {
                this[method](event);
            }
        };
        Outlayer.prototype.bindResize = function() {
            if (this.isResizeBound) {
                return;
            }
            eventie.bind(window, "resize", this);
            this.isResizeBound = true;
        };
        Outlayer.prototype.unbindResize = function() {
            if (this.isResizeBound) {
                eventie.unbind(window, "resize", this);
            }
            this.isResizeBound = false;
        };
        Outlayer.prototype.onresize = function() {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            var _this = this;
            function delayed() {
                _this.resize();
                delete _this.resizeTimeout;
            }
            this.resizeTimeout = setTimeout(delayed, 100);
        };
        Outlayer.prototype.resize = function() {
            if (!this.isResizeBound || !this.needsResizeLayout()) {
                return;
            }
            this.layout();
        };
        Outlayer.prototype.needsResizeLayout = function() {
            var size = getSize(this.element);
            var hasSizes = this.size && size;
            return hasSizes && size.innerWidth !== this.size.innerWidth;
        };
        Outlayer.prototype.addItems = function(elems) {
            var items = this._itemize(elems);
            if (items.length) {
                this.items = this.items.concat(items);
            }
            return items;
        };
        Outlayer.prototype.appended = function(elems) {
            var items = this.addItems(elems);
            if (!items.length) {
                return;
            }
            this.layoutItems(items, true);
            this.reveal(items);
        };
        Outlayer.prototype.prepended = function(elems) {
            var items = this._itemize(elems);
            if (!items.length) {
                return;
            }
            var previousItems = this.items.slice(0);
            this.items = items.concat(previousItems);
            this._resetLayout();
            this._manageStamps();
            this.layoutItems(items, true);
            this.reveal(items);
            this.layoutItems(previousItems);
        };
        Outlayer.prototype.reveal = function(items) {
            var len = items && items.length;
            if (!len) {
                return;
            }
            for (var i = 0; i < len; i++) {
                var item = items[i];
                item.reveal();
            }
        };
        Outlayer.prototype.hide = function(items) {
            var len = items && items.length;
            if (!len) {
                return;
            }
            for (var i = 0; i < len; i++) {
                var item = items[i];
                item.hide();
            }
        };
        Outlayer.prototype.getItem = function(elem) {
            for (var i = 0, len = this.items.length; i < len; i++) {
                var item = this.items[i];
                if (item.element === elem) {
                    return item;
                }
            }
        };
        Outlayer.prototype.getItems = function(elems) {
            if (!elems || !elems.length) {
                return;
            }
            var items = [];
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                var item = this.getItem(elem);
                if (item) {
                    items.push(item);
                }
            }
            return items;
        };
        Outlayer.prototype.remove = function(elems) {
            elems = makeArray(elems);
            var removeItems = this.getItems(elems);
            if (!removeItems || !removeItems.length) {
                return;
            }
            this._itemsOn(removeItems, "remove", function() {
                this.emitEvent("removeComplete", [ this, removeItems ]);
            });
            for (var i = 0, len = removeItems.length; i < len; i++) {
                var item = removeItems[i];
                item.remove();
                removeFrom(item, this.items);
            }
        };
        Outlayer.prototype.destroy = function() {
            var style = this.element.style;
            style.height = "";
            style.position = "";
            style.width = "";
            for (var i = 0, len = this.items.length; i < len; i++) {
                var item = this.items[i];
                item.destroy();
            }
            this.unbindResize();
            delete this.element.outlayerGUID;
            if (jQuery) {
                jQuery.removeData(this.element, this.constructor.namespace);
            }
        };
        Outlayer.data = function(elem) {
            var id = elem && elem.outlayerGUID;
            return id && instances[id];
        };
        Outlayer.create = function(namespace, options) {
            function Layout() {
                Outlayer.apply(this, arguments);
            }
            if (Object.create) {
                Layout.prototype = Object.create(Outlayer.prototype);
            } else {
                extend(Layout.prototype, Outlayer.prototype);
            }
            Layout.prototype.constructor = Layout;
            Layout.defaults = extend({}, Outlayer.defaults);
            extend(Layout.defaults, options);
            Layout.prototype.settings = {};
            Layout.namespace = namespace;
            Layout.data = Outlayer.data;
            Layout.Item = function LayoutItem() {
                Item.apply(this, arguments);
            };
            Layout.Item.prototype = new Item();
            docReady(function() {
                var dashedNamespace = toDashed(namespace);
                var elems = document.querySelectorAll(".js-" + dashedNamespace);
                var dataAttr = "data-" + dashedNamespace + "-options";
                for (var i = 0, len = elems.length; i < len; i++) {
                    var elem = elems[i];
                    var attr = elem.getAttribute(dataAttr);
                    var options;
                    try {
                        options = attr && JSON.parse(attr);
                    } catch (error) {
                        if (console) {
                            console.error("Error parsing " + dataAttr + " on " + elem.nodeName.toLowerCase() + (elem.id ? "#" + elem.id : "") + ": " + error);
                        }
                        continue;
                    }
                    var instance = new Layout(elem, options);
                    if (jQuery) {
                        jQuery.data(elem, namespace, instance);
                    }
                }
            });
            if (jQuery && jQuery.bridget) {
                jQuery.bridget(namespace, Layout);
            }
            return Layout;
        };
        Outlayer.Item = Item;
        return Outlayer;
    }
    if (typeof define === "function" && define.amd) {
        define("outlayer/outlayer", [ "eventie/eventie", "doc-ready/doc-ready", "eventEmitter/EventEmitter", "get-size/get-size", "matches-selector/matches-selector", "./item" ], outlayerDefinition);
    } else {
        window.Outlayer = outlayerDefinition(window.eventie, window.docReady, window.EventEmitter, window.getSize, window.matchesSelector, window.Outlayer.Item);
    }
})(window);

(function(window) {
    var indexOf = Array.prototype.indexOf ? function(items, value) {
        return items.indexOf(value);
    } : function(items, value) {
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            if (item === value) {
                return i;
            }
        }
        return -1;
    };
    function masonryDefinition(Outlayer, getSize) {
        var Masonry = Outlayer.create("masonry");
        Masonry.prototype._resetLayout = function() {
            this.getSize();
            this._getMeasurement("columnWidth", "outerWidth");
            this._getMeasurement("gutter", "outerWidth");
            this.measureColumns();
            var i = this.cols;
            this.colYs = [];
            while (i--) {
                this.colYs.push(0);
            }
            this.maxY = 0;
        };
        Masonry.prototype.measureColumns = function() {
            this.getContainerWidth();
            if (!this.columnWidth) {
                var firstItem = this.items[0];
                var firstItemElem = firstItem && firstItem.element;
                this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth || this.containerWidth;
            }
            this.columnWidth += this.gutter;
            this.cols = Math.floor((this.containerWidth + this.gutter) / this.columnWidth);
            this.cols = Math.max(this.cols, 1);
        };
        Masonry.prototype.getContainerWidth = function() {
            var container = this.options.isFitWidth ? this.element.parentNode : this.element;
            var size = getSize(container);
            this.containerWidth = size && size.innerWidth;
        };
        Masonry.prototype._getItemLayoutPosition = function(item) {
            item.getSize();
            var remainder = item.size.outerWidth % this.columnWidth;
            var mathMethod = remainder && remainder < 1 ? "round" : "ceil";
            var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
            colSpan = Math.min(colSpan, this.cols);
            var colGroup = this._getColGroup(colSpan);
            var minimumY = Math.min.apply(Math, colGroup);
            var shortColIndex = indexOf(colGroup, minimumY);
            var position = {
                x: this.columnWidth * shortColIndex,
                y: minimumY
            };
            var setHeight = minimumY + item.size.outerHeight;
            var setSpan = this.cols + 1 - colGroup.length;
            for (var i = 0; i < setSpan; i++) {
                this.colYs[shortColIndex + i] = setHeight;
            }
            return position;
        };
        Masonry.prototype._getColGroup = function(colSpan) {
            if (colSpan < 2) {
                return this.colYs;
            }
            var colGroup = [];
            var groupCount = this.cols + 1 - colSpan;
            for (var i = 0; i < groupCount; i++) {
                var groupColYs = this.colYs.slice(i, i + colSpan);
                colGroup[i] = Math.max.apply(Math, groupColYs);
            }
            return colGroup;
        };
        Masonry.prototype._manageStamp = function(stamp) {
            var stampSize = getSize(stamp);
            var offset = this._getElementOffset(stamp);
            var firstX = this.options.isOriginLeft ? offset.left : offset.right;
            var lastX = firstX + stampSize.outerWidth;
            var firstCol = Math.floor(firstX / this.columnWidth);
            firstCol = Math.max(0, firstCol);
            var lastCol = Math.floor(lastX / this.columnWidth);
            lastCol -= lastX % this.columnWidth ? 0 : 1;
            lastCol = Math.min(this.cols - 1, lastCol);
            var stampMaxY = (this.options.isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
            for (var i = firstCol; i <= lastCol; i++) {
                this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
            }
        };
        Masonry.prototype._getContainerSize = function() {
            this.maxY = Math.max.apply(Math, this.colYs);
            var size = {
                height: this.maxY
            };
            if (this.options.isFitWidth) {
                size.width = this._getContainerFitWidth();
            }
            return size;
        };
        Masonry.prototype._getContainerFitWidth = function() {
            var unusedCols = 0;
            var i = this.cols;
            while (--i) {
                if (this.colYs[i] !== 0) {
                    break;
                }
                unusedCols++;
            }
            return (this.cols - unusedCols) * this.columnWidth - this.gutter;
        };
        Masonry.prototype.needsResizeLayout = function() {
            var previousWidth = this.containerWidth;
            this.getContainerWidth();
            return previousWidth !== this.containerWidth;
        };
        return Masonry;
    }
    if (typeof define === "function" && define.amd) {
        define([ "outlayer/outlayer", "get-size/get-size" ], masonryDefinition);
    } else {
        window.Masonry = masonryDefinition(window.Outlayer, window.getSize);
    }
})(window);

(function(window) {
    "use strict";
    var $ = window.jQuery;
    var console = window.console;
    var hasConsole = typeof console !== "undefined";
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }
    var objToString = Object.prototype.toString;
    function isArray(obj) {
        return objToString.call(obj) === "[object Array]";
    }
    function makeArray(obj) {
        var ary = [];
        if (isArray(obj)) {
            ary = obj;
        } else if (typeof obj.length === "number") {
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            ary.push(obj);
        }
        return ary;
    }
    function defineImagesLoaded(EventEmitter, eventie) {
        function ImagesLoaded(elem, options, onAlways) {
            if (!(this instanceof ImagesLoaded)) {
                return new ImagesLoaded(elem, options);
            }
            if (typeof elem === "string") {
                elem = document.querySelectorAll(elem);
            }
            this.elements = makeArray(elem);
            this.options = extend({}, this.options);
            if (typeof options === "function") {
                onAlways = options;
            } else {
                extend(this.options, options);
            }
            if (onAlways) {
                this.on("always", onAlways);
            }
            this.getImages();
            if ($) {
                this.jqDeferred = new $.Deferred();
            }
            var _this = this;
            setTimeout(function() {
                _this.check();
            });
        }
        ImagesLoaded.prototype = new EventEmitter();
        ImagesLoaded.prototype.options = {};
        ImagesLoaded.prototype.getImages = function() {
            this.images = [];
            for (var i = 0, len = this.elements.length; i < len; i++) {
                var elem = this.elements[i];
                if (elem.nodeName === "IMG") {
                    this.addImage(elem);
                }
                var childElems = elem.querySelectorAll("img");
                for (var j = 0, jLen = childElems.length; j < jLen; j++) {
                    var img = childElems[j];
                    this.addImage(img);
                }
            }
        };
        ImagesLoaded.prototype.addImage = function(img) {
            var loadingImage = new LoadingImage(img);
            this.images.push(loadingImage);
        };
        ImagesLoaded.prototype.check = function() {
            var _this = this;
            var checkedCount = 0;
            var length = this.images.length;
            this.hasAnyBroken = false;
            if (!length) {
                this.complete();
                return;
            }
            function onConfirm(image, message) {
                if (_this.options.debug && hasConsole) {
                    console.log("confirm", image, message);
                }
                _this.progress(image);
                checkedCount++;
                if (checkedCount === length) {
                    _this.complete();
                }
                return true;
            }
            for (var i = 0; i < length; i++) {
                var loadingImage = this.images[i];
                loadingImage.on("confirm", onConfirm);
                loadingImage.check();
            }
        };
        ImagesLoaded.prototype.progress = function(image) {
            this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
            var _this = this;
            setTimeout(function() {
                _this.emit("progress", _this, image);
                if (_this.jqDeferred) {
                    _this.jqDeferred.notify(_this, image);
                }
            });
        };
        ImagesLoaded.prototype.complete = function() {
            var eventName = this.hasAnyBroken ? "fail" : "done";
            this.isComplete = true;
            var _this = this;
            setTimeout(function() {
                _this.emit(eventName, _this);
                _this.emit("always", _this);
                if (_this.jqDeferred) {
                    var jqMethod = _this.hasAnyBroken ? "reject" : "resolve";
                    _this.jqDeferred[jqMethod](_this);
                }
            });
        };
        if ($) {
            $.fn.imagesLoaded = function(options, callback) {
                var instance = new ImagesLoaded(this, options, callback);
                return instance.jqDeferred.promise($(this));
            };
        }
        var cache = {};
        function LoadingImage(img) {
            this.img = img;
        }
        LoadingImage.prototype = new EventEmitter();
        LoadingImage.prototype.check = function() {
            var cached = cache[this.img.src];
            if (cached) {
                this.useCached(cached);
                return;
            }
            cache[this.img.src] = this;
            if (this.img.complete && this.img.naturalWidth !== undefined) {
                this.confirm(this.img.naturalWidth !== 0, "naturalWidth");
                return;
            }
            var proxyImage = this.proxyImage = new Image();
            eventie.bind(proxyImage, "load", this);
            eventie.bind(proxyImage, "error", this);
            proxyImage.src = this.img.src;
        };
        LoadingImage.prototype.useCached = function(cached) {
            if (cached.isConfirmed) {
                this.confirm(cached.isLoaded, "cached was confirmed");
            } else {
                var _this = this;
                cached.on("confirm", function(image) {
                    _this.confirm(image.isLoaded, "cache emitted confirmed");
                    return true;
                });
            }
        };
        LoadingImage.prototype.confirm = function(isLoaded, message) {
            this.isConfirmed = true;
            this.isLoaded = isLoaded;
            this.emit("confirm", this, message);
        };
        LoadingImage.prototype.handleEvent = function(event) {
            var method = "on" + event.type;
            if (this[method]) {
                this[method](event);
            }
        };
        LoadingImage.prototype.onload = function() {
            this.confirm(true, "onload");
            this.unbindProxyEvents();
        };
        LoadingImage.prototype.onerror = function() {
            this.confirm(false, "onerror");
            this.unbindProxyEvents();
        };
        LoadingImage.prototype.unbindProxyEvents = function() {
            eventie.unbind(this.proxyImage, "load", this);
            eventie.unbind(this.proxyImage, "error", this);
        };
        return ImagesLoaded;
    }
    if (typeof define === "function" && define.amd) {
        define([ "eventEmitter/EventEmitter", "eventie/eventie" ], defineImagesLoaded);
    } else {
        window.imagesLoaded = defineImagesLoaded(window.EventEmitter, window.eventie);
    }
})(window);

(function() {
    "use strict";
    angular.module("masonry", [ "ng" ]).directive("masonry", function($parse) {
        return {
            restrict: "AC",
            link: function(scope, elem, attrs) {
                scope.items = [];
                var container = elem[0];
                var options = angular.extend({
                    itemSelector: ".item"
                }, JSON.parse(attrs.masonry));
                scope.obj = new Masonry(container, options);
            }
        };
    }).directive("masonryTile", function() {
        return {
            restrict: "AC",
            link: function(scope, elem) {
                var master = elem.parent("*[masonry]:first").scope();
                var masonry = master.obj;
                elem.ready(function() {
                    masonry.addItems([ elem ]);
                    masonry.reloadItems();
                    imagesLoaded(elem[0], function() {
                        masonry.layout();
                    });
                });
            }
        };
    });
})();

var app = angular.module("vine", [ "ngResource", "ngRoute", "masonry" ]);

app.config([ "$routeProvider", function($routeProvider) {
    $routeProvider.when("/vine", {
        templateUrl: "/views/vine.html",
        controller: "VineController"
    }).when("/instagram", {
        templateUrl: "/views/instagram.html",
        controller: "InstagramController"
    }).when("/imgur", {
        templateUrl: "/views/imgur.html",
        controller: "ImgurController"
    }).when("/amazon", {
        templateUrl: "/views/amazon.html",
        controller: "AmazonController"
    }).otherwise({
        redirectTo: "/vine"
    });
} ]);

"use strict";

app.controller("AmazonController", [ "$scope", "$timeout", "Amazon", function($scope, $timeout, Amazon) {
    $scope.search = "Ralph";
    $scope.category = "Toys";
    $scope.products = [];
    $scope.searchAmazon = function() {
        Amazon.search($scope.category, $scope.search, function(data) {
            $scope.products = data.Item;
        });
    };
} ]);

"use strict";

app.controller("ImgurController", [ "$scope", "$timeout", "Imgur", function($scope, $timeout, Imgur) {
    $scope.images = [];
    $scope.search = "basketball";
    $scope.page = 1;
    $scope.loading = false;
    $scope.recent = false;
    $scope.sub = false;
    var doSearchTimeout = false;
    $scope.loadImages = function() {
        $scope.images = [];
        window.scrollTo(0, 0);
        ga("send", "pageview", "reddit/" + $scope.search);
        if ($scope.recent) {
            Imgur.recent($scope.page, function(data) {
                $scope.images = data;
            });
        } else if ($scope.sub) {
            Imgur.subrecent($scope.search, $scope.page, function(data) {
                console.log(data);
                $scope.images = data;
            });
        } else {
            Imgur.search($scope.search, $scope.page, function(data) {
                $scope.images = data;
            });
        }
    };
    $scope.loadMore = function() {
        $scope.page++;
        $scope.loadImages();
    };
    $scope.$watch("search", function() {
        if (doSearchTimeout) {
            $timeout.cancel(doSearchTimeout);
        }
        $scope.page = 1;
        doSearchTimeout = $timeout(function() {
            $scope.loadImages();
        }, 500);
    });
    $scope.$watch("recent", function() {
        if (doSearchTimeout) {
            $timeout.cancel(doSearchTimeout);
        }
        $scope.page = 1;
        doSearchTimeout = $timeout(function() {
            $scope.loadImages();
        }, 250);
    });
} ]);

"use strict";

app.controller("InstagramController", [ "$scope", "$timeout", "Instagram", function($scope, $timeout, Instagram) {
    $scope.pics = [];
    $scope.tag = "jesus";
    $scope.loading = false;
    $scope.maxID = null;
    var doSearchTimeout = false;
    $scope.loadPics = function() {
        ga("send", "pageview", "instagram/" + $scope.tag);
        $scope.loading = true;
        Instagram.search($scope.tag, $scope.maxID, function(res) {
            $scope.maxID = res.pagination.next_max_id;
            $scope.loading = false;
            $scope.pics.push.apply($scope.pics, res.data);
        });
    };
    $scope.$watch("tag", function() {
        if (doSearchTimeout) {
            $timeout.cancel(doSearchTimeout);
        }
        doSearchTimeout = $timeout(function() {
            $scope.pics = [];
            $scope.loadPics();
        }, 500);
    });
} ]);

"use strict";

app.factory("Vine", [ "$http", function($http) {
    var baseURL = "http://bhvine.herokuapp.com";
    return {
        search: function(tag, page, callback) {
            $http.jsonp(baseURL + "/search/" + tag + "?page=" + page + "&callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        },
        channel: function(tag, page, callback) {
            $http.jsonp(baseURL + "/recent/" + tag + "?page=" + page + "&callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        },
        channels: function(callback) {
            $http.jsonp(baseURL + "/channels?callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        }
    };
} ]);

app.factory("Instagram", [ "$http", function($http) {
    return {
        search: function(tag, maxID, callback) {
            var endPoint = "https://api.instagram.com/v1/tags/" + tag + "/media/recent?max_tag_id=" + maxID + "&client_id=642176ece1e7445e99244cec26f4de1f&callback=JSON_CALLBACK";
            $http.jsonp(endPoint).success(function(response) {
                callback(response);
            });
        }
    };
} ]);

app.factory("Amazon", [ "$http", function($http) {
    return {
        search: function(category, search, callback) {
            var endPoint = "http://bhvine.herokuapp.com/amazon/" + category + "/" + search + "?callback=JSON_CALLBACK";
            $http.jsonp(endPoint).success(function(response) {
                callback(response.ItemSearchResponse.Items);
            });
        }
    };
} ]);

app.factory("Imgur", [ "$http", function($http) {
    var baseURL = "http://bhvine.herokuapp.com/imgur/";
    return {
        search: function(search, page, callback) {
            $http.jsonp(baseURL + search + "/" + page + "?callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        },
        recent: function(page, callback) {
            $http.jsonp(baseURL + "recent/" + page + "?callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        },
        subrecent: function(search, page, callback) {
            $http.jsonp(baseURL + "sub/" + search + "/" + page + "?callback=JSON_CALLBACK").success(function(response) {
                callback(response.data);
            });
        }
    };
} ]);

"use strict";

app.controller("VineController", [ "$scope", "$timeout", "Vine", function($scope, $timeout, Vine) {
    $scope.videos = [];
    $scope.loading = false;
    $scope.searchTerm = "drums";
    $scope.page = 1;
    $scope.categories = [];
    $scope.category = null;
    var doSearchTimeout = false;
    $scope.searchVids = function() {
        ga("send", "pageview", "vine/" + $scope.searchTerm);
        if (!$scope.searchTerm) {
            $scope.videos = [];
        } else {
            $scope.loading = true;
            if ($scope.category) {
                Vine.channel($scope.category.featuredChannelId, $scope.page, function(response) {
                    $scope.videos.push.apply($scope.videos, response.records);
                    $scope.loading = false;
                });
            } else {
                Vine.search($scope.searchTerm, $scope.page, function(response) {
                    $scope.videos.push.apply($scope.videos, response.records);
                    $scope.loading = false;
                });
            }
        }
    };
    $scope.loadCategories = function() {
        Vine.channels(function(response) {
            $scope.categories = response.records;
        });
    };
    $scope.loadMore = function() {
        $scope.page++;
        $scope.searchVids();
    };
    $scope.toggleVideo = function(video) {
        var player = document.getElementById("vine-" + video.postId);
        if (!player.getAttribute("src")) {
            player.setAttribute("src", video.videoUrl);
            player.play();
        }
        player.addEventListener("click", function() {
            if (player.paused) {
                player.play();
            } else {
                player.pause();
            }
        });
    };
    $scope.$watch("searchTerm", function() {
        if (doSearchTimeout) {
            $timeout.cancel(doSearchTimeout);
        }
        doSearchTimeout = $timeout(function() {
            $scope.videos = [];
            $scope.searchVids();
        }, 250);
    });
    $scope.$watch("category", function() {
        if (doSearchTimeout) {
            $timeout.cancel(doSearchTimeout);
        }
        doSearchTimeout = $timeout(function() {
            $scope.videos = [];
            $scope.searchVids();
        }, 250);
    });
} ]);