module.exports = function(Piler) {
  var csso;
  csso = require("csso");
  Piler.addMinifier('csso', function() {
    return function(code, options) {
      if (options == null) {
        options = {};
      }
      if (options.noCache === true) {
        return csso.justDoIt(code);
      } else {
        return Piler.Cache.cache(code, function() {
          return csso.justDoIt(code);
        });
      }
    };
  });
};
