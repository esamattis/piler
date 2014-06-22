module.exports = function(Piler) {
  var stylus;
  stylus = require("stylus");
  Piler.addCompiler('stylus', function() {
    var nib, obj;
    obj = {
      on: {
        file: {
          object: ['styl']
        }
      },
      targetExt: 'css',
      execute: function(code, filename, options) {
        options = Piler.utils._.merge({}, options, {
          filename: filename
        });
        return new Piler.utils.Q(function(resolve, reject) {
          stylus(code).set(options).render(function(err, code) {
            if (err) {
              return reject(err);
            }
            resolve(code);
          });
        });
      }
    };

    /*istanbul ignore catch */
    try {
      nib = require('nib');
      obj.execute = function(code, filename, options) {
        return new Piler.utils.Q(function(resolve, reject) {
          options = Piler.utils._.merge({}, options, {
            filename: filename
          });
          stylus(code).set(options).use(nib()).render(function(err, code) {
            if (err) {
              return reject(err);
            }
            resolve(code);
          });
        });
      };
    } catch (_error) {

    }
    return obj;
  });
};
