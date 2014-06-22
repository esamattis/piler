module.exports = function(Piler) {
  var less, render;
  less = require('less');
  render = Piler.utils.Q.promisify(less.render, less);
  Piler.addCompiler('less', function() {
    return {
      execute: function(code, filename, options) {
        return render(code, Piler.utils._.merge({}, options, {
          paths: [Piler.utils.path.dirname(filename)]
        }));
      },
      on: {
        file: {
          object: ['less']
        }
      },
      targetExt: 'css'
    };
  });
};
