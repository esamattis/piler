//
// Simple wrappers for JS and CSS minifiers so that they are easy to change if
// needed.
//

var csso, jsp, pro, uglify;

csso = require("csso");

try {
  uglify = require("uglify-js");
} catch (error) {
  // uglify-js' packaging currently sucks. Add fallback.
  console.log("no uglify", error);
  exports.jsMinify = function(code) {
    return code;
  };
  exports.jsBeautify = function(code) {
    return code;
  };
}

exports.cssMinify = function(code) {
  return csso.justDoIt(code);
};

if (uglify != null) {
  jsp = uglify.parser;
  pro = uglify.uglify;
  exports.jsMinify = function(code) {
    var ast;
    ast = jsp.parse(code);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    return pro.gen_code(ast);
  };
  exports.jsBeautify = function(code) {
    var ast;
    ast = jsp.parse(code);
    return pro.gen_code(ast, {
      beautify: true
    });
  };
}
