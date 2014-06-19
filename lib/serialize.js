module.exports = function(classes, mainExports) {
  'use strict';
  var codeFrom, crypto, debug, executableFrom, pilers, toGlobals, types;
  crypto = require('crypto');
  debug = classes.utils.debug("piler:serialize");

  /**
   * A code object
   *
   * @typedef {Object} Piler.codeOb
   * @property {Function} getId Get the code id
   * @property {Function(cb:Function)} getCode Get the code itself
   */
  pilers = {
    raw: function(ob) {
      return ob.object;
    },
    obj: function(ob) {
      return toGlobals(ob.object);
    },
    fn: function(ob) {
      return executableFrom(ob.object);
    },
    file: function(ob) {
      return classes.utils.fs.readFileAsync(ob.filePath).then(function(data) {
        return classes.Compilers.compile(classes.utils.extension(ob.filePath), ob.filePath, data.toString());
      });
    },
    module: function(ob) {
      return this.file(ob).then(function(code) {
        return "require.register(\"" + (classes.utils.path.basename(ob.filePath).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});";
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
      var code, k, v;
      if (Array.isArray(obj)) {
        return this._array(obj);
      }
      code = "{";
      for (k in obj) {
        v = obj[k];
        code += "\"" + k + "\": " + (codeFrom(v)) + ",";
      }
      return "" + (removeTrailingComma(code)) + " }";
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
    debug: debug,
    codeObject: (function() {
      var getId;
      getId = function() {
        var filename, hash, sum;
        sum = crypto.createHash('sha1');
        if (this.type === "file") {
          sum.update(this.filePath);
        } else {
          sum.update(codeFrom(this));
        }
        hash = sum.digest('hex').substring(10, 0);
        if (this.adjustFilename) {
          filename = classes.utils.path.basename(this.filePath);
          filename = filename.replace(/\./g, "_");
          filename = filename.replace(/\-/g, "_");
          hash = filename + "_" + hash;
        }
        return hash;
      };
      return function() {
        this.getId = getId;
        this.getCode = function(cb) {
          return classes.utils.Q["try"](function() {
            return pilers[this.type](this);
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
     * @function Piler.addSerializable
     */
    addSerializable: mainExports.addSerializable = function(name, factoryFn) {
      var oldFn;
      oldFn = pilers[name] ? pilers[name] : function() {};
      pilers[name] = factoryFn(classes);
      return oldFn;
    },
    stringify: codeFrom = function(obj) {
      var _name;
      return typeof types[_name = typeof obj] === "function" ? types[_name](obj) : void 0;
    }
  };
};
