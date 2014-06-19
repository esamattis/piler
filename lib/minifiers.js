module.exports = function(classes, mainExports) {
  'use strict';
  var addMinifier, css, csso, debug, minifiers, out;
  csso = require("csso");
  out = {
    debug: debug = classes.utils.debug("piler:minify")
  };
  css = function(code, options) {
    if (options == null) {
      options = {};
    }
    if (options.noCache === true) {
      return csso.justDoIt(code);
    } else {
      return classes.Cache.cache(code, function() {
        return csso.justDoIt(code);
      });
    }
  };
  minifiers = {};

  /**
   * Minify code on demand
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
   * Add your own minifier
   *
   * @function Piler.addMinifier
   * @param {String} ext Extension
   * @param {Piler.factoryFn} factory Function that returns a function
   * @returns {Function} Returns the old minify function, if any
   */
  out.addMinifier = addMinifier = mainExports.addMinifier = function(ext, factoryFn) {
    var oldFn;
    oldFn = minifiers[ext] ? minifiers[ext] : function() {};
    minifiers[ext] = factoryFn(classes);
    return oldFn;
  };

  /**
   * Remove a minifier
   *
   * @function Piler.removeMinifier
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
