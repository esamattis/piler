module.exports = function(Piler) {
  var UglifyJS;
  UglifyJS = require("uglify-js");
  Piler.addMinifier('uglify', function() {
    return {
      execute: function(code, options) {
        var ast, compressed_ast, compressor;
        if (options == null) {
          options = {};
        }
        ast = UglifyJS.parse(code);
        ast.figure_out_scope();
        compressor = UglifyJS.Compressor();
        compressed_ast = ast.transform(compressor);
        compressed_ast.figure_out_scope();
        if (options.noMangleNames !== true) {
          compressed_ast.mangle_names();
        }
        if (options.beautify == null) {
          options.beautify = false;
        }
        return compressed_ast.print_to_string(options);
      },
      on: {
        file: {
          object: ['js']
        }
      }
    };
  });
};
