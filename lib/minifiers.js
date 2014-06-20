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
   * @returns {String}
   */
  out.minify = mainExports.minify = function(ext, code, options, cb) {
    if (!ext || !minifiers[ext]) {
      throw new Error("Minify for '" + ext + "' not found");
    }
    debug("Minifying code for '" + ext + "'");
    return classes.utils.Q["try"](function() {
      return minifiers[ext](code, options);
    }).nodeify(cb);
  };

  /**
   * @function Piler.addMinifier
   */

  /**
   * Add your own minifier
   *
   * @function Piler.Minifiers.addMinifier
   * @param {String} ext Extension
   * @param {Piler.FactoryFn} factoryFn Function that returns a function
   * @returns {Function} Returns the old minify function, if any
   */
  out.addMinifier = mainExports.addMinifier = function(ext, factoryFn) {
    var oldFn;
    oldFn = minifiers[ext] ? minifiers[ext] : function() {};
    minifiers[ext] = factoryFn(classes);
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
