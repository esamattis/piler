var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = function(Piler) {
  var JSManager, JSPile;
  JSPile = (function(_super) {
    __extends(JSPile, _super);


    /**
     * @member {String} ext
     * @memberof Piler.JSPile
     * @instance
     */

    JSPile.prototype.ext = "js";


    /**
     * Add line comment
     *
     * @function commentLine
     * @memberof Piler.JSPile
     * @returns {String}
     * @instance
     */

    JSPile.prototype.commentLine = function(line) {
      return "// " + (line.trim());
    };


    /**
     * @augments Piler.BasePile
     * @constructor Piler.JSPile
     */

    function JSPile() {
      JSPile.__super__.constructor.apply(this, arguments);
    }


    /**
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @function addModule
     * @param {String} filePath
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.JSPile} `this`
     */

    JSPile.prototype.addModule = function(filePath, before) {
      if (before == null) {
        before = false;
      }
      filePath = classes.utils.path.normalize(filePath);
      if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
        this.add({
          type: "module",
          object: filePath
        }, before);
      }
      return this;
    };


    /**
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @param {Object} ob
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.JSPile} `this`
     */

    JSPile.prototype.addOb = function(ob, before) {
      if (before == null) {
        before = false;
      }
      this.code[!before ? 'push' : 'unshift'](classes.Serialize.codeObject.call({
        type: "object",
        object: ob
      }));
      return this;
    };


    /**
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @param {Function} fn
     * @param {Boolean} [before=false]
     * @instance
     * @function addExec
     * @returns {Piler.JSPile} `this`
     */

    JSPile.prototype.addExec = function(fn, before) {
      if (before == null) {
        before = false;
      }
      this.code[!before ? 'push' : 'unshift'](classes.Serialize.codeObject.call({
        type: "fn",
        object: fn
      }));
      return this;
    };

    return JSPile;

  })(Piler.BasePile);
  return JSManager = (function(_super) {
    __extends(JSManager, _super);

    JSManager.prototype.type = JSPile;

    JSManager.prototype.contentType = "application/javascript";


    /**
     * @constructor Piler.JSManager
     * @augments Piler.PileManager
     */

    function JSManager() {
      JSManager.__super__.constructor.apply(this, arguments);
      this.piles.global.addExec(function() {
        window._NS = function(nsString) {
          var ns, parent, _i, _len, _ref;
          parent = window;
          _ref = nsString.split(".");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ns = _ref[_i];
            parent = parent[ns] != null ? parent[ns] : parent[ns] = {};
          }
          return parent;
        };
        return window.__SET = function(ns, ob) {
          var nsOb, parts, target;
          parts = ns.split(".");
          if (parts.length === 1) {
            return window[parts[0]] = ob;
          } else {
            nsOb = _NS(parts.slice(0, -1).join("."));
            target = parts.slice(-1)[0];
            return nsOb[target] = ob;
          }
        };
      });
      return;
    }


    /**
     * @memberof Piler.JSManager
     * @instance
     * @function wrapInTag
     * @returns {String}
     */

    JSManager.prototype.wrapInTag = function(uri, extra) {
      if (extra == null) {
        extra = "";
      }
      return "<script type=\"text/javascript\"  src=\"" + uri + "\" " + extra + " ></script>";
    };


    /**
     * @memberof Piler.JSManager
     * @instance
     * @private
     * @param {String} ns
     * @function _isReserved
     * @throws Error
     */

    JSManager.prototype._isReserved = function(ns) {
      if (classes.utils.reserved.indexOf(ns) !== -1) {
        throw new Error("" + ns + " is a reserved word and can't be used");
      }
    };


    /**
     * @memberof Piler.JSManager
     * @instance
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @function addModule
     * @returns {Piler.JSManager} `this`
     */

    JSManager.prototype.addModule = defNs(function(ns, path, before) {
      var pile;
      if (before == null) {
        before = false;
      }
      this._isReserved(ns);
      pile = this.getPile(ns);
      pile.addModule(path, before);
      return this;
    });


    /**
     * @memberof Piler.JSManager
     * @instance
     * @param {String} ns
     * @param {String} ob
     * @param {Boolean} [before=false]
     * @function addOb
     * @returns {Piler.JSManager} `this`
     */

    JSManager.prototype.addOb = defNs(function(ns, ob, before) {
      var pile;
      if (before == null) {
        before = false;
      }
      this._isReserved(ns);
      pile = this.getPile(ns);
      pile.addOb(ob, before);
      return this;
    });


    /**
     * @memberof Piler.JSManager
     * @instance
     * @function addExec
     * @param {String} ns
     * @param {String} fn
     * @param {Boolean} [before=false]
     * @returns {Piler.JSManager} `this`
     */

    JSManager.prototype.addExec = defNs(function(ns, fn, before) {
      var pile;
      if (before == null) {
        before = false;
      }
      this._isReserved(ns);
      pile = this.getPile(ns);
      pile.addExec(fn, before);
      return this;
    });


    /**
     * @memberof Piler.JSManager
     * @instance
     * @function setMiddleware
     * @returns {Piler.JSManager} `this`
     */

    JSManager.prototype.setMiddleware = function(app) {
      var _this;
      debug('setting JSManager middleware');
      _this = this;
      app.use(function(req, res, next) {
        var _base;
        if (res.piler == null) {
          res.piler = {};
        }
        if ((_base = res.piler).js == null) {
          _base.js = {};
        }
        res.piler.js = {
          addExec: bindFn(_this, 'addExec'),
          addRaw: bindFn(_this, 'addRaw'),
          addOb: bindFn(_this, 'addOb'),
          addModule: bindFn(_this, 'addModule'),
          addFile: bindFn(_this, 'addFile'),
          addUrl: bindFn(_this, 'addUrl')
        };
        next();
      });
      return this;
    };

    return JSManager;

  })(Piler.PileManager);
};
