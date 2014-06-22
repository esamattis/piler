var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      return "/* " + (line.trim()) + " */";
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
     * @returns {Promise}
     */

    JSPile.prototype.addModule = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = Piler.utils.path.normalize(filePath);
      return this.duplicated('file', filePath).then((function(_this) {
        return function() {
          return _this.add({
            type: "module",
            object: filePath,
            options: options
          });
        };
      })(this));
    };


    /**
     * Add a object
     *
     * @function Piler.Main.JSPile#addOb
     * @param {Object} ob
     * @param {Boolean} [options={}]
     * @returns {Promise}
     */

    JSPile.prototype.addOb = function(ob, options) {
      if (options == null) {
        options = {};
      }
      return this.duplicated('obj', ob).then((function(_this) {
        return function() {
          return _this.add({
            type: "obj",
            object: ob,
            options: options
          });
        };
      })(this));
    };


    /**
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addExec
     * @param {Function} fn
     * @param {Boolean} [options={}]
     * @returns {Promise}
     */

    JSPile.prototype.addExec = function(fn, options) {
      if (options == null) {
        options = {};
      }
      return this.duplicated('fn', fn).then((function(_this) {
        return function() {
          return _this.add({
            type: "fn",
            object: fn,
            options: options
          });
        };
      })(this));
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

    function JSManager(name, options) {
      this.name = name;
      this.options = options;
      JSManager.__super__.constructor.call(this, this.name, this.options);
      Piler.utils._.defaults(this.options, {
        scriptType: true
      });
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
      return "<script" + (this.options.scriptType ? ' type="text/javascript"' : '') + " src=\"" + uri + "\" " + extra + "></script>";
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
     * @returns {Promise}
     */

    JSManager.prototype.addModule = function(path, options) {
      this._isReserved(options);
      return this.add('addModule', path, options);
    };


    /**
     * @function Piler.Main.JSManager#addOb
     * @param {String} ob
     * @param {Boolean} [options]
     * @returns {Promise}
     */

    JSManager.prototype.addOb = function(ob, options) {
      this._isReserved(options);
      return this.add('addOb', ob, options);
    };


    /**
     * @function Piler.Main.JSManager#addExec
     * @param {String} fn
     * @param {Boolean} [options]
     * @returns {Promise}
     */

    JSManager.prototype.addExec = function(fn, options) {
      this._isReserved(options);
      return this.add('addExec', fn, options);
    };


    /**
     * @function Piler.Main.JSManager#setMiddleware
     * @returns {Promise}
     */

    JSManager.prototype.locals = function(response) {
      var namespace;
      JSManager.__super__.locals.call(this, response);
      if (!Piler.utils.objectPath.get(this, 'js.namespace')) {
        Piler.Main.debug('setting JSManager locals');
        namespace = this.createTempNamespace();
        Piler.utils.objectPath.set(this, 'js.namespace', namespace);
      } else {
        namespace = this.js.namespace;
      }
      response.piler.js = {
        namespace: namespace,
        addExec: this.bindToPile('addExec', namespace),
        addRaw: this.bindToPile('addRaw', namespace),
        addOb: this.bindToPile('addOb', namespace),
        addModule: this.bindToPile('addModule', namespace),
        addFile: this.bindToPile('addFile', namespace),
        addUrl: this.bindToPile('addUrl', namespace),
        addMultiline: this.bindToPile('addMultiline', namespace)
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
        code.push("piler.set(" + (JSON.stringify(nsString)) + ", " + (Piler.Serialize.stringify(v)) + ");");
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
