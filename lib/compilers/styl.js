module.exports = function(Piler) {
  var stylus;
  stylus = require("stylus");
  Piler.addCompiler('stylus', function() {
    var nib, obj;
    obj = {
      outputExt: 'css',
      targetExt: ['styl'],
      render: function(filename, code, options) {
        options = Piler.utils._.merge({}, options, {
          filename: filename
        });
        return Piler.utils.Q(function(resolve, reject) {
          stylus(code).set(options).render(function(err, code) {
            if (err) {
              return reject(err);
            }
            resolve(code);
          });
        });
      }
    };

    /*istanbul ignore else */
    if (require.resolve('nib')) {
      nib = require('nib');
      obj.render = function(filename, code, options) {
        return Piler.utils.Q(function(resolve, reject) {
          stylus(code).set(options).render(function(err, code) {
            if (err) {
              return reject(err);
            }
            resolve(code);
          });
        });
      };
    }
    return obj;
  });
};
