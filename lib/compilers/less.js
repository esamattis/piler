module.exports = function(Piler) {
  var less, render;
  less = require('less');
  render = Piler.utils.Promise.promisify(less.render, less);
  Piler.addProcessor('less', function() {
    return {
      pre: {
        render: function(code, asset, options) {
          return render(code, Piler.utils._.merge({}, options, {
            paths: asset && asset.options.filePath ? [Piler.utils.path.dirname(asset.options.filePath)] : []
          }));
        },
        condition: function(asset, options) {
          return asset.options.filePath && Piler.utils.extension(asset.options.filePath) === 'less';
        }
      }
    };
  });
};
