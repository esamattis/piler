'use strict';
var UglifyJS, addMinifier, cache, css, csso, debug, js, minifiers;

csso = require("csso");

debug = require("debug")("piler:minify");

cache = require('./cache');

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
    return cache(code, function() {
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
      return cache(code, fnCompress);
    }
  };
}

minifiers = {};

module.exports.minify = function(ext, code, options) {
  if (!ext || !minifiers[ext]) {
    throw new Error("Minify for '" + ext + "' not found");
  }
  debug("Minifying code for '" + ext + "'");
  return minifiers[ext](code, options);
};


/**
 * @typedef {Function} Piler.minifyFactory
 * @returns {{render:Function}}
 */


/**
 * Add your own minifier
 *
 * @function Piler.addMinifier
 * @param {String} ext Extension
 * @param {Piler.minifyFactory} factory Function that returns a function
 * @returns {Function} Returns the old minify function, if any
 */

module.exports.addMinifier = addMinifier = function(ext, factory) {
  var oldFn;
  oldFn = minifiers[ext] ? minifiers[ext] : function() {};
  minifiers[ext] = factory();
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

module.exports.removeMinifier = function(ext) {

  /*istanbul ignore else */
  if (minifiers[ext]) {
    delete minifiers[ext];
  }
};
