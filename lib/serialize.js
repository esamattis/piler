module.exports = function(Piler, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Serialize
   */
  var codeFrom, crypto, debug, defaults, multiline, serializables, types;
  crypto = require('crypto');
  debug = Piler.utils.debug('piler:serialize');

  /**
   * @typedef {Function} Piler.Serialize.Serializable
   * @param {Piler.Serialize.CodeObject} ob Receives the code object
   */

  /**
   * Serializable callback
   *
   * @example
   *   function(callback) {
   *     // do some transformation then return
   *   }
   *
   * @callback Piler.Serialize.Callback
   *
   * @param {Piler.Serialize.CodeObject} ob The current object
   * @returns {Promise|String|Number|Boolean|Function}
   */

  /**
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObjectOptions
   * @property {Boolean} [before=false] Prepend into the pile
   * @property {Boolean} [asIs=false] Wrap the tag using the {@link Piler.Serialize.CodeObject.raw() CodeObject.raw()} instead of the {@link Piler.Serialize.CodeObject.contents()}
   * @property {String|null} [filePath=null] Assign that object is a filepath
   * @property {String|null} [hashFrom=null] Create the hash from a member of the object instead
   * @property {*} [extra=null] Extra information to pass to the wrapInTag function
   */

  /**
   * A code object, that is an agnostic asset
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   *
   * @property {Function} id Get the code id
   * @property {Function} raw Get the unaltered content
   * @property {Function} type Get the registered type
   * @property {Function} toString Serialized object from raw
   * @property {Function} contents Get the contents itself
   * @property {Piler.Serialize.CodeObjectOptions} options Get the registered type
   */
  multiline = function(ob) {
    var matches;
    matches = /\/\*!?(?:\@preserve)?([\s\S]*?)\*\//.exec(ob);
    if (!matches) {
      throw new Error('Multiline failed to match');
    }
    return matches[1];
  };
  serializables = {
    raw: function(ob) {
      return ob.raw();
    },
    url: function(ob) {
      return ob.raw();
    },
    multiline: function(ob) {
      return multiline(ob.raw());
    },
    file: function(ob) {
      return Piler.utils.fs.readFileAsync(ob.raw()).then(function(data) {
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
      return '{' + arr.join(',') + '}';
    },
    _array: function(array) {
      var arr, v, _i, _len;
      arr = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        v = array[_i];
        arr.push("" + (codeFrom(v)));
      }
      return '[' + arr.join(',') + ']';
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
        if (!this.options.name) {
          sum = crypto.createHash('sha1');
          if (this.options.hashFrom) {
            sum.update((function(_this) {
              return function() {
                var f;
                f = Piler.utils.objectPath.get(_this, _this.options.hashFrom);
                if (Piler.utils._.isFunction(f)) {
                  f = f();
                }
                if (typeof f !== 'string') {
                  return codeFrom(f);
                } else {
                  return f;
                }
              };
            })(this)());
          } else {
            sum.update(codeFrom([this.raw(), this.options, this.type()]));
          }
          hash = sum.digest('hex').substring(12, 0);
          if (this.options.filePath) {
            filename = Piler.utils.path.basename(this.options.filePath);
            filename = filename.replace(/[^a-zA-Z0-9]+/g, '_');
            hash = "" + filename + "_" + hash;
          }
        } else {
          hash = this.options.name;
          if (this.options.filePath) {
            hash = "" + (Piler.utils.path.basename(this.options.filePath)) + "_" + hash;
          }
          hash = hash.replace(/[^a-zA-Z0-9]+/g, '_');
        }
        return hash;
      };
      return function() {
        var raw, self, type;
        if (typeof this.id === 'function') {
          throw new Error('This object was already serialized');
        }
        type = this.type;
        raw = this.raw;
        self = this;
        defaults(this);
        this.id = getId;
        this.raw = function() {
          return raw;
        };
        this.toString = function() {
          return codeFrom(raw);
        };
        this.type = function() {
          return type;
        };
        this.contents = function(cb) {
          return Piler.utils.Promise["try"](function() {
            return serializables[type](self);
          }).bind(this).nodeify(cb);
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
     * @example
     *   Piler.addSerializable('name', function(Piler){
     *     return function(ob){
     *       return  // do something with ob;
     *     };
     *   });
     *
     * @function Piler.Serialize.addSerializable
     * @oaran {String} name
     * @param {Piler.FactoryFn} factoryFn
     * @returns {Piler.Serialize.Serializable|null}
     */
    addSerializable: mainExports.addSerializable = function(name, factoryFn) {
      var oldFn;
      oldFn = serializables[name] ? (debug('Overwriting', name), serializables[name]) : null;
      debug('Added', name);
      serializables[name] = factoryFn(Piler);
      return oldFn;
    },

    /**
     * Generates code string from given object. Works for numbers, strings, regexes
     * and even functions. Does not handle circular references.
     *
     * @function Piler.Serialize.stringify
     */
    stringify: codeFrom = function(obj) {
      var _name;
      return typeof types[_name = typeof obj] === "function" ? types[_name](obj) : void 0;
    },

    /**
     * Place the defaults options on the object
     *
     * @example
     *   var obj = {};
     *   Piler.Serialize.defaults(obj);
     *   obj = {
     *     options: {
     *       // default CodeObject options
     *     }
     *   };
     *
     * @function Piler.Serialize.defaults
     * @param  {Object} obj Object to receive defaults
     * @returns {Object}
     */
    defaults: defaults = function(obj) {
      Piler.utils.objectPath.ensureExists(obj, 'options', {});
      Piler.utils._.defaults(obj.options, {
        filePath: null,
        asIs: false,
        hashFrom: null,
        before: false,
        extra: null,
        processors: {}
      });
      return obj;
    }
  };
};
