module.exports = function(Piler) {
  var stylus;
  stylus = require("stylus");
  Piler.addCompiler('styl', function() {
    var nib, obj;
    obj = {
      targetExt: "css",
      render: function(filename, code, options) {
        var styl;
        options = Piler.utils._.merge({}, options, {
          filename: filename
        });
        styl = stylus(code).set(options);
        return (Piler.utils.Q.promisify(styl.render, styl))();
      }
    };

    /*istanbul ignore else */
    if (require.resolve('nib')) {
      nib = require('nib');
      obj.render = function(filename, code, options) {
        var styl;
        options = Piler.utils._.merge({}, options, {
          filename: filename
        });
        styl = stylus(code).set(options).use(nib());
        return (Piler.utils.Q.promisify(styl.render, styl))();
      };
    }
    return obj;
  });
};
