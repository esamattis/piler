module.exports = function(Piler) {
  var stylus;
  stylus = require('stylus');
  Piler.addProcessor('stylus', function() {
    var nib, obj, render;
    render = void 0;

    /*istanbul ignore next: wont exist in tests */
    render = function(code, asset, options) {
      if (asset && asset.options.filePath) {
        options = Piler.utils._.merge({}, options, {
          filename: asset.options.filePath
        });
      }
      return new Piler.utils.Promise(function(resolve, reject) {
        stylus(code, options).render(function(err, code) {
          if (err) {
            return reject(err);
          }
          resolve(code);
        });
      });
    };
    obj = {
      pre: {
        render: render,
        condition: function(asset, options) {
          return asset.options.filePath && Piler.utils.extension(asset.options.filePath) === 'styl';
        }
      }
    };

    /*istanbul ignore catch */
    try {
      nib = require('nib');
      obj.pre.render = function(code, asset, options) {
        return new Piler.utils.Promise(function(resolve, reject) {
          if (asset.options.filePath) {
            options = Piler.utils._.merge({}, options, {
              filename: asset.options.filePath
            });
          }
          stylus(code, options).use(nib()).render(function(err, code) {
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
