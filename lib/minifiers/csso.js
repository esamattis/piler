module.exports = function(Piler) {
  var csso;
  csso = require('csso');
  Piler.addProcessor('csso', function() {
    return {
      post: {
        render: function(code, asset, options) {
          return csso.justDoIt(code, options.structures);
        },
        defaults: {
          structures: false
        },
        condition: function(asset, options) {
          return (asset.options.filePath && asset.options.filePath.indexOf('.min') === -1 && Piler.utils.extension(asset.options.filePath) === 'css') && (asset.options.env === 'production');
        }
      }
    };
  });
};
