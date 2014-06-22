module.exports = function(Piler) {
  var csso;
  csso = require("csso");
  Piler.addMinifier('csso', function() {
    return {
      execute: function(code, options) {
        if (options == null) {
          options = {};
        }
        return csso.justDoIt(code);
      },
      on: {
        file: {
          object: ['css']
        }
      }
    };
  });
};
