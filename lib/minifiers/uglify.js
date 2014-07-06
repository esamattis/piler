module.exports = function(Piler) {
  var UglifyJS;
  UglifyJS = require('uglify-js');
  Piler.addProcessor('uglify', function() {
    return {
      post: {
        render: function(code, asset, options) {
          options = Piler.utils._.merge(options, {
            fromString: true
          });
          return UglifyJS.minify(code, options).code;
        },
        defaults: {
          mangle: true,
          compress: {}
        },
        condition: function(asset, options) {
          return (asset.options.filePath && asset.options.filePath.indexOf('.min') === -1 && Piler.utils.extension(asset.options.filePath) === 'js') && (asset.options.env === 'production');
        }
      }
    };
  });
};
