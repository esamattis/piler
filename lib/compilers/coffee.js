module.exports = function(Piler) {
  var coffeescript;
  coffeescript = require('coffee-script');
  Piler.addCompiler('coffeescript', function() {
    return {
      execute: function(code, filename, options) {
        return coffeescript.compile(code, options);
      },
      on: {
        file: {
          object: ['coffee']
        }
      },
      targetExt: 'js'
    };
  });
};
