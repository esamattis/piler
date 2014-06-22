module.exports = function(Piler, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Serialize
   */
  var codeFrom, crypto, debug, pilers, types;
  crypto = require('crypto');
  debug = Piler.utils.debug("piler:serialize");

  /**
   * Serializable callback
   *
   * @callback Piler.Serialize.Callback
   * @param {Piler.Serialize.CodeObject} ob The current object
   * @returns {Promise|String|Number|Boolean|Function}
   */

  /**
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   * @property {Function} id Get the code id
   * @property {Piler.Serialize.Callback} contents Get the contents itself
   * @property {Function} object Get the registered object
   * @property {Function} type Get the registered type
   */
  pilers = {
    raw: function(ob) {
      return ob.object();
    },
    url: function(ob) {
      return ob.object();
    },
    multiline: function(ob) {
      return Piler.utils.multiline(ob.object());
    },
    file: function(ob) {
      return Piler.utils.fs.readFileAsync(ob.object()).then(function(data) {
        return data.toString();
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
      var arr, k, v;
      if (Array.isArray(obj)) {
        return this._array(obj);
      }
      arr = [];
      for (k in obj) {
        v = obj[k];
        arr.push("" + (JSON.stringify(k)) + ": " + (codeFrom(v)));
      }
      return "{" + arr.join(',') + "}";
    },
    _array: function(array) {
      var arr, v, _i, _len;
      arr = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        v = array[_i];
        arr.push("" + (codeFrom(v)));
      }
      return "[" + arr.join(', ') + "]";
    }
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
        var filename, hash, sum;
        sum = crypto.createHash('sha1');
        if (this.options.noSumContent) {
          sum.update(this.object());
        } else {
          sum.update(codeFrom([this.object(), this.options, this.type()]));
        }
        hash = sum.digest('hex').substring(12, 0);
        if (this.options.filePath) {
          filename = Piler.utils.path.basename(this.object());
          filename = filename.replace(/\./g, "_");
          filename = filename.replace(/\-/g, "_");
          hash = filename + "_" + hash;
        }
        return hash;
      };
      return function() {
        var obj, self, type;
        type = this.type;
        obj = this.object;
        self = this;
        this.id = getId;
        this.object = function() {
          return obj;
        };
        this.toString = function() {
          return codeFrom(this.object());
        };
        this.type = function() {
          return type;
        };
        this.contents = function(cb) {
          return Piler.utils.Q["try"](function() {
            return pilers[type](self);
          }).nodeify(cb);
        };
        return this;
      };
    })(),

    /**
     * Creates a SHA1 from string
     *
     * @function Piler.Serializable.sha1
     * @param {String} code
     * @param {String} [out] Digest
     * @returns {crypto.Hash}
     */
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

    /**
     * Add a new kind of serializable object, that should be treated differently from
     * the built-in ones. Methods returned by the factory are bound to each {@link Piler.Serialize.CodeObject}
     *
     * @function Piler.Serialize.addSerializable
     */
    addSerializable: mainExports.addSerializable = function(name, factoryFn) {
      var oldFn;
      oldFn = pilers[name] ? pilers[name] : function() {};
      debug('Added', name);
      pilers[name] = factoryFn(Piler);
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
