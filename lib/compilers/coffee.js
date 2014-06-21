module.exports = function(Piler) {
  var coffeescript;
  coffeescript = require('coffee-script');
  Piler.addCompiler('coffeescript', function() {
    return {
      render: function(filename, code, options) {
        return coffeescript.compile(code, options);
      },
      targetExt: ['coffee'],
      outputExt: 'js'
    };
  });
};
