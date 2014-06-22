module.exports = function(Piler, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Minifiers
   */
  var debug, minifiers, out;
  out = {

    /**
     * Output debug messages as if it was from {@link Piler.Minifiers}
     * @function Piler.Minifiers.debug
     */
    debug: debug = Piler.utils.debug("piler:minifiers")
  };
  minifiers = {};

  /**
   * @function Piler.minify
   */

  /**
   * Minify code on demand
   *
   * @function Piler.Minifiers.minify
   * @param {Function} name
   * @param {Function} code
   * @param {Function} [options]
   * @param {Function} [cb]
   * @returns {Promise}
   */
  out.minify = mainExports.minify = function(name, code, options, cb) {
    if (!name || !minifiers[name]) {
      throw new Error("Minify '" + name + "' not found");
    }
    debug("Minifying code '" + name + "'");
    return minifiers[name].execute(code, options).nodeify(cb);
  };

  /**
   * @function Piler.addMinifier
   */

  /**
   * Add your own minifier
   *
   * @function Piler.Minifiers.addMinifier
   * @param {String} name Name
   * @param {Piler.FactoryFn} factoryFn Function that returns a definition
   * @returns {Function|null} Returns the old minify function, if any
   */
  out.addMinifier = mainExports.addMinifier = function(name, factoryFn) {
    var def, oldFn;
    if (!name) {
      throw new Error('Missing name for minifier');
    }
    if (!Piler.utils._.isFunction(factoryFn)) {
      throw new Error('factoryFn must be a function');
    }
    oldFn = minifiers[name] ? minifiers[name] : null;
    def = factoryFn(Piler);
    if (!def.on) {
      throw new Error("Missing 'on' for minifier '" + name + "'");
    }
    if (!Piler.utils._.isFunction(def.execute)) {
      throw new Error("Missing 'execute' for minifier '" + name + "'");
    }
    debug('Added', name, def.on);
    def.execute = Piler.utils.Q.method(def.execute);
    minifiers[name] = def;
    return oldFn;
  };

  /**
   * @function Piler.removeMinifier
   */

  /**
   * Remove a minifier
   *
   * @function Piler.Minifiers.removeMinifier
   * @param {String} ext Extension
   */
  out.removeMinifier = mainExports.removeMinifier = function(ext) {

    /*istanbul ignore else */
    if (minifiers[ext]) {
      delete minifiers[ext];
    }
  };
  return out;
};
