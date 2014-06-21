var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = function(Piler) {
  var JSManager, JSPile;
  JSPile = (function(_super) {
    __extends(JSPile, _super);


    /**
     * @member {String} Piler.Main.JSPile#ext
     * @default js
     */

    JSPile.prototype.ext = "js";


    /**
     * Add line comment
     *
     * @function Piler.Main.JSPile#commentLine
     * @returns {String}
     * @instance
     */

    JSPile.prototype.commentLine = function(line) {
      return "// " + (line.trim());
    };


    /**
     * @augments Piler.Main.BasePile
     * @constructor Piler.Main.JSPile
     */

    function JSPile() {
      JSPile.__super__.constructor.apply(this, arguments);
    }


    /**
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addModule
     * @param {String} filePath
     * @param {Object} [options={}]
     * @returns {Piler.Main.JSPile} `this`
     */

    JSPile.prototype.addModule = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = Piler.utils.path.normalize(filePath);
      if (__indexOf.call(this.getObjects('file'), filePath) < 0) {
        this.add({
          type: "module",
          object: filePath,
          options: options
        });
      }
      return this;
    };


    /**
     * Add a object
     *
     * @function Piler.Main.JSPile#addOb
     * @param {Object} ob
     * @param {Boolean} [options={}]
     * @returns {Piler.Main.JSPile} `this`
     */

    JSPile.prototype.addOb = function(ob, options) {
      if (options == null) {
        options = {};
      }
      this.add({
        type: "obj",
        object: ob,
        options: options
      });
      return this;
    };


    /**
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addExec
     * @param {Function} fn
     * @param {Boolean} [options={}]
     * @returns {Piler.Main.JSPile} `this`
     */

    JSPile.prototype.addExec = function(fn, options) {
      if (options == null) {
        options = {};
      }
      this.add({
        type: "fn",
        object: fn,
        options: options
      });
      return this;
    };

    return JSPile;

  })(Piler.getPile('BasePile'));
  JSManager = (function(_super) {
    __extends(JSManager, _super);


    /**
     * @member {Piler.Main.JSPile} Piler.Main.JSManager#type
     */

    JSManager.prototype.type = JSPile;


    /**
     * @member {String} Piler.Main.JSManager#contentType
     */

    JSManager.prototype.contentType = "application/javascript";


    /**
     * @constructor Piler.Main.JSManager
     * @augments Piler.Main.PileManager
     */

    function JSManager() {
      JSManager.__super__.constructor.apply(this, arguments);
      this.piles.global.addExec(function() {
        var namespace;
        if (window.piler == null) {
          window.piler = {};
        }
        window.piler.namespace = namespace = function(nsString) {
          var ns, parent, _i, _len, _ref;
          parent = window;
          _ref = nsString.split(".");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ns = _ref[_i];
            parent = parent[ns] != null ? parent[ns] : parent[ns] = {};
          }
          return parent;
        };
        window.piler.set = function(ns, ob) {
          var nsOb, parts, target;
          parts = ns.split(".");
          if (parts.length === 1) {
            return window[parts[0]] = ob;
          } else {
            nsOb = namespace(parts.slice(0, -1).join("."));
            target = parts.slice(-1)[0];
            return nsOb[target] = ob;
          }
        };
      });
      return;
    }


    /**
     * @function Piler.Main.JSManager#wrapInTag
     * @returns {String}
     */

    JSManager.prototype.wrapInTag = function(uri, extra) {
      if (extra == null) {
        extra = "";
      }
      return "<script type=\"text/javascript\"  src=\"" + uri + "\" " + extra + " ></script>";
    };


    /**
     * @function Piler.Main.JSManager#_isReserved
     * @private
     * @param {String} ns
     * @throws Error
     */

    JSManager.prototype._isReserved = function(ns) {
      if (ns && ns.namespace && (Piler.utils.reserved.indexOf(ns.namespace) !== -1)) {
        throw new Error("" + ns + " is a reserved word and can't be used");
      }
    };


    /**
     * @function Piler.Main.JSManager#addModule
     * @param {String} path
     * @param {Boolean} [options]
     * @returns {Piler.Main.JSManager} `this`
     */

    JSManager.prototype.addModule = function(path, options) {
      this._isReserved(options);
      this.add('addModule', path, options);
      return this;
    };


    /**
     * @function Piler.Main.JSManager#addOb
     * @param {String} ob
     * @param {Boolean} [options]
     * @returns {Piler.Main.JSManager} `this`
     */

    JSManager.prototype.addOb = function(ob, options) {
      this._isReserved(options);
      this.add('addOb', ob, options);
      return this;
    };


    /**
     * @function Piler.Main.JSManager#addExec
     * @param {String} fn
     * @param {Boolean} [options]
     * @returns {Piler.Main.JSManager} `this`
     */

    JSManager.prototype.addExec = function(fn, options) {
      this._isReserved(options);
      this.add('addExec', fn, options);
      return this;
    };


    /**
     * @function Piler.Main.JSManager#setMiddleware
     * @returns {Piler.Main.JSManager} `this`
     */

    JSManager.prototype.locals = function(response) {
      JSManager.__super__.locals.call(this, response);
      Piler.Main.debug('setting JSManager locals');
      response.piler.js = {
        addExec: this.bindToPile('addExec'),
        addRaw: this.bindToPile('addRaw'),
        addOb: this.bindToPile('addOb'),
        addModule: this.bindToPile('addModule'),
        addFile: this.bindToPile('addFile'),
        addUrl: this.bindToPile('addUrl')
      };
      return this;
    };

    JSManager.prototype.middleware = function() {
      return JSManager.__super__.middleware.apply(this, arguments);
    };

    return JSManager;

  })(Piler.getManager('PileManager'));
  Piler.addSerializable('fn', function() {
    var executableFrom;
    executableFrom = function(fn, context) {
      if (!context) {
        return "(" + fn + ")();\n";
      }
      return "(" + fn + ").call(" + context + ");\n";
    };
    return function(ob) {
      return executableFrom(ob.object());
    };
  });
  Piler.addSerializable('obj', function() {
    var toGlobals;
    toGlobals = function(globals) {
      var code, nsString, v;
      code = [];
      for (nsString in globals) {
        v = globals[nsString];
        code.push("piler.set(window, " + (JSON.stringify(nsString)) + ", " + (Piler.Serialize.stringify(v)) + ");");
      }
      return code.join('\n');
    };
    return function(ob) {
      return toGlobals(ob.object());
    };
  });
  Piler.addSerializable('module', function() {
    return function(ob) {
      return this.file(ob).then(function(code) {
        return "require.register(\"" + (Piler.utils.path.basename(ob.object()).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});";
      });
    };
  });
  Piler.addManager('js', function() {
    return JSManager;
  });
  Piler.addPile('js', function() {
    return JSPile;
  });
};
