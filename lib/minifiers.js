module.exports = function(classes, mainExports) {
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
    debug: debug = classes.utils.debug("piler:minifiers")
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
    return classes.utils.Q["try"](function() {
      return minifiers[name](code, options);
    }).nodeify(cb);
  };

  /**
   * @function Piler.addMinifier
   */

  /**
   * Add your own minifier
   *
   * @function Piler.Minifiers.addMinifier
   * @param {String} name Name
   * @param {Piler.FactoryFn} factoryFn Function that returns a function
   * @returns {Function|null} Returns the old minify function, if any
   */
  out.addMinifier = mainExports.addMinifier = function(name, factoryFn) {
    var oldFn;
    oldFn = minifiers[name] ? minifiers[name] : null;
    debug("Added minifier '" + name + "'");
    minifiers[name] = classes.utils.Q.method(factoryFn(classes));
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
