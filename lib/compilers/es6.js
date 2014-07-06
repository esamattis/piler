module.exports = function(Piler) {
  var traceur;
  traceur = require('traceur');
  Piler.addProcessor('es6', function() {
    return {
      pre: {
        render: function(code, asset, options) {
          return traceur.compile(code, options).js;
        },
        condition: function(asset, options) {
          return asset.options.filePath && asset.options.filePath.indexOf('es6') !== -1;
        },
        defaults: {
          modules: 'commonjs'
        }
      }
    };
  });
};
