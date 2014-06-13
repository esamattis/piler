'use strict';
var UglifyJS, cache, csso, debug, error;

csso = require("csso");

debug = require("debug")("piler:minify");

cache = require("./cache");

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

exports.cssMinify = function(code) {
  return cache(code, function() {
    return csso.justDoIt(code);
  });
};

if (UglifyJS != null) {
  exports.jsMinify = function(code) {
    return cache(code, function() {
      var ast, compressed_ast, compressor;
      ast = UglifyJS.parse(code);
      ast.figure_out_scope();
      compressor = UglifyJS.Compressor();
      compressed_ast = ast.transform(compressor);
      compressed_ast.figure_out_scope();
      compressed_ast.mangle_names();
      return compressed_ast.print_to_string({
        beautify: false
      });
    });
  };
  exports.jsBeautify = function(code) {
    return cache(code, function() {
      var ast;
      ast = UglifyJS.parse(code);
      ast.figure_out_scope();
      return ast.print_to_string({
        beautify: true
      });
    });
  };
}
