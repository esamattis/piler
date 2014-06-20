module.exports = function(Piler) {
  var UglifyJS;
  UglifyJS = require("uglify-js");
  Piler.addMinifier('uglify', function() {
    return function(code, options) {
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
        return Piler.Cache.cache(code, fnCompress);
      }
    };
  });
};
