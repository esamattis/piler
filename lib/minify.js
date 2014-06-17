'use strict';
var UglifyJS, cache, csso, debug, error;

csso = require("csso");

debug = require("debug")("piler:minify");

cache = require('./cache');

UglifyJS = false;

try {
  UglifyJS = require("uglify-js");
} catch (_error) {
  error = _error;
  debug("no uglify", error);
  exports.jsMinify = function(code) {
    return code;
  };
  exports.jsBeautify = function(code) {
    return code;
  };
}

exports.cssMinify = function(code, options) {
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

if (UglifyJS != null) {
  debug("using uglify");
  exports.jsMinify = function(code, options) {
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
  exports.jsBeautify = function(code, options) {
    var fnCompress;
    if (options == null) {
      options = {};
    }
    fnCompress = function() {
      var ast;
      ast = UglifyJS.parse(code);
      ast.figure_out_scope();
      return ast.print_to_string({
        beautify: true
      });
    };
    if (options.noCache === true) {
      return fnCompress();
    } else {
      return cache(code, fnCompress);
    }
  };
}
