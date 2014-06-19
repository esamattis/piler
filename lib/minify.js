module.exports = function(classes, mainExports) {
  'use strict';
  var UglifyJS, addMinifier, css, csso, debug, js, minifiers, out;
  csso = require("csso");
  out = {
    debug: debug = classes.utils.debug("piler:minify")
  };
  UglifyJS = false;

  /*istanbul ignore next */
  js = function(code) {
    return code;
  };

  /*istanbul ignore catch */
  try {
    UglifyJS = require("uglify-js");
  } catch (_error) {

  }
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

  /*istanbul ignore else */
  if (UglifyJS != null) {
    debug("using uglify");
    js = function(code, options) {
      var fnCompress;
      if (options == null) {
        options = {};
      }
      fnCompress = function() {
        var ast, compressed_ast, compressor;
        ast = UglifyJS.parse(code);
        ast.figure_out_scope();
        compressor = UglifyJS.Compressor();
        compressed_ast = ast.transform(compressor);
        compressed_ast.figure_out_scope();
        if (options.noMangleNames !== true) {
          compressed_ast.mangle_names();
        }
        return compressed_ast.print_to_string({
          beautify: false
        });
      };
      if (options.noCache === true) {
        return fnCompress();
      } else {
        return classes.Cache.cache(code, fnCompress);
      }
    };
  }
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
  (function() {
    addMinifier('js', function() {
      return js;
    });
    addMinifier('css', function() {
      return css;
    });
  })();

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
