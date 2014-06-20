module.exports = function(classes, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Serialize
   */
  var codeFrom, crypto, debug, executableFrom, pilers, toGlobals, types;
  crypto = require('crypto');
  debug = classes.utils.debug("piler:serialize");

  /**
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   * @property {Function} id Get the code id
   * @property {Function} contents Get the contents itself
   */
  pilers = {
    raw: function(ob) {
      return ob.object;
    },
    url: function(ob) {
      return ob.object;
    },
    obj: function(ob) {
      return toGlobals(ob.object);
    },
    fn: function(ob) {
      return executableFrom(ob.object);
    },
    file: function(ob) {
      return classes.utils.fs.readFileAsync(ob.object).then(function(data) {
        return classes.Compilers.compile(classes.utils.extension(ob.object), ob.object, data.toString());
      });
    },
    module: function(ob) {
      return this.file(ob).then(function(code) {
        return "require.register(\"" + (classes.utils.path.basename(ob.object).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});";
      });
    }
  };
  types = {
    "function": function(fn) {
      return "" + fn;
    },
    string: function(s) {
      return JSON.stringify(s);
    },
    number: function(n) {
      return n.toString();
    },
    boolean: function(n) {
      return n.toString();
    },
    object: function(obj) {
      var arr, code, k, v;
      if (Array.isArray(obj)) {
        return this._array(obj);
      }
      code = "{";
      arr = [];
      for (k in obj) {
        v = obj[k];
        arr.push("" + (JSON.stringify(k)) + ": " + (codeFrom(v)));
      }
      return arr.join(',') + code + "}";
    },
    _array: function(array) {
      var arr, code, v, _i, _len;
      code = "[";
      arr = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        v = array[_i];
        arr.push("" + (codeFrom(v)));
      }
      return arr.join(', ') + code + "]";
    }
  };
  executableFrom = function(fn, context) {
    if (!context) {
      return "(" + fn + ")();\n";
    }
    return "(" + fn + ").call(" + context + ");\n";
  };
  toGlobals = function(globals) {
    var code, nsString, v;
    code = "";
    for (nsString in globals) {
      v = globals[nsString];
      code += "__SET(" + (JSON.stringify(nsString)) + ", " + (codeFrom(v)) + ");\n";
    }
    return code;
  };
  return {

    /**
     * Output debug messages as if it was from {@link Piler.Serialize}
     * @function Piler.Serialize.debug
     */
    debug: debug,
    serialize: (function() {
      var getId;
      getId = function() {
        var filename, hash, obj, sum;
        sum = crypto.createHash('sha1');
        if (this.fromUrl) {
          sum.update(this.object());
        } else {
          sum.update(codeFrom(this));
        }
        hash = sum.digest('hex').substring(10, 0);
        if (this.adjustFilename && (obj = this.object()) && (classes.utils._.isString(obj))) {
          filename = classes.utils.path.basename(obj);
          filename = filename.replace(/\./g, "_");
          filename = filename.replace(/\-/g, "_");
          hash = filename + "_" + hash;
        }
        return hash;
      };
      return function() {
        var obj, type;
        type = this.type;
        obj = this.object;
        this.id = getId;
        this.object = function() {
          return obj;
        };
        this.type = function() {
          return type;
        };
        this.contents = function(cb) {
          return classes.utils.Q["try"](function() {
            return pilers[type](this);
          }).nodeify(cb);
        };
        return this;
      };
    })(),
    sha1: function(code, out) {
      var sha1;
      sha1 = crypto.createHash('sha1');
      if (code) {
        sha1.update(code);
        if (out) {
          return sha1.digest(out);
        }
      }
      return sha1;
    },

    /**
     * Add a new kind of serializable object, that should be treated differently from
     * the built-in ones
     *
     * @function Piler.Serialize.addSerializable
     */
    addSerializable: mainExports.addSerializable = function(name, factoryFn) {
      var oldFn;
      oldFn = pilers[name] ? pilers[name] : function() {};
      pilers[name] = factoryFn(classes);
      return oldFn;
    },

    /**
     * Generates code string from given object. Works for numbers, strings, regexes
     * and even functions. Does not handle circular references.
     * @function Piler.Serialize.stringify
     */
    stringify: codeFrom = function(obj) {
      var _name;
      return typeof types[_name = typeof obj] === "function" ? types[_name](obj) : void 0;
    }
  };
};
