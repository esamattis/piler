module.exports = function(Piler) {
  var coffeescript;
  coffeescript = require('coffee-script');
  Piler.addProcessor('coffeescript', function() {
    return {
      pre: {
        render: function(code, asset, options) {
          return coffeescript.compile(code, options);
        },
        condition: function(asset, options) {
          return asset.options.filePath && Piler.utils.extension(asset.options.filePath) === 'coffee';
        }
      }
    };
  });
};
