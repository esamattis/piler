var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(Piler) {
  var JSManager, JSPile;
  JSPile = (function(_super) {
    __extends(JSPile, _super);

    JSPile.prototype.processors = {
      'coffeescript': {},
      'uglify': {}
    };


    /**
     * @member {String} Piler.Main.JSPile#ext
     * @default js
     */

    JSPile.prototype.ext = 'js';


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
     * @returns {Piler.Main.JSPile}
     */

    JSPile.prototype.addModule = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = Piler.utils.path.normalize(filePath);
      if (!this.duplicated('file', filePath)) {
        this.add({
          type: 'module',
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
     * @returns {Piler.Main.JSPile}
     */

    JSPile.prototype.addOb = function(ob, options) {
      if (options == null) {
        options = {};
      }
      if (!this.duplicated('obj', ob)) {
        this.add({
          type: 'obj',
          object: ob,
          options: options
        });
      }
      return this;
    };


    /**
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addExec
     * @param {Function} fn
     * @param {Boolean} [options={}]
     * @returns {Piler.Main.JSPile}
     */

    JSPile.prototype.addExec = function(fn, options) {
      if (options == null) {
        options = {};
      }
      if (!this.duplicated('fn', fn)) {
        this.add({
          type: 'fn',
          object: fn,
          options: options
        });
      }
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

    JSManager.prototype.contentType = 'application/javascript';


    /**
     * @constructor Piler.Main.JSManager
     * @augments Piler.Main.PileManager
     */

    function JSManager(name, options) {
      this.name = name;
      this.options = options;
      JSManager.__super__.constructor.call(this, this.name, this.options);
      Piler.utils._.defaults(this.options, {
        scriptType: 'text/javascript'
      });
      this.piles.global.addExec(function() {
        var namespace;
        if (window.piler == null) {
          window.piler = {};
        }
        window.piler.namespace = namespace = function(nsString) {
          var ns, parent, _i, _len, _ref;
          parent = window;
          _ref = nsString.split('.');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ns = _ref[_i];
            parent = parent[ns] != null ? parent[ns] : parent[ns] = {};
          }
          return parent;
        };
        window.piler.set = function(ns, ob, options) {
          var nsOb, parts, target;
          if (ns) {
            parts = ns.split('.');
            if (parts.length === 1) {
              window[parts[0]] = ob;
            } else {
              nsOb = namespace(parts.slice(0, -1).join('.'));
              target = parts.slice(-1)[0];
              nsOb[target] = ob;
            }
          }
        };
      }, {
        before: true
      });
      return;
    }


    /**
     * @function Piler.Main.JSManager#wrapInTag
     * @returns {String}
     */

    JSManager.prototype.wrapInTag = function(uri, extra) {
      if (extra == null) {
        extra = '';
      }
      return "<script" + (this.options.scriptType ? ' type="' + this.options.scriptType + '"' : '') + " src=\"" + uri + "\" " + extra + "></script>";
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
     * @returns {Piler.Main.JSManager}
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
     * @returns {Piler.Main.JSManager}
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
     * @returns {Piler.Main.JSManager}
     */

    JSManager.prototype.addExec = function(fn, options) {
      this._isReserved(options);
      this.add('addExec', fn, options);
      return this;
    };


    /**
     * @function Piler.Main.JSManager#setMiddleware
     * @returns {Piler.Main.JSManager}
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
    executableFrom = function(fn, options) {
      if (!options.context) {
        return "(" + fn + ")();\n";
      }
      return "(" + fn + ").call(" + options.context + ");\n";
    };
    return function(ob) {
      return executableFrom(ob.raw(), ob.options);
    };
  });
  Piler.addSerializable('obj', function() {
    var toGlobals;
    toGlobals = function(globals, options) {
      var code, nsString, v;
      code = [];
      options = Piler.Serialize.stringify(options);
      for (nsString in globals) {
        v = globals[nsString];
        code.push("piler.set(" + (JSON.stringify(nsString)) + ", " + (Piler.Serialize.stringify(v)) + ", " + options + ");");
      }
      return code.join('\n');
    };
    return function(ob) {
      return toGlobals(ob.raw(), Piler.utils._.merge({}, ob.options.js));
    };
  });
  Piler.addSerializable('module', function() {
    return function(ob) {
      return this.file(ob).then(function(code) {
        return "require.register(\"" + (Piler.utils.path.basename(ob.options.filePath).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});";
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
