module.exports = function(Piler) {
  Piler.addCompiler('css', function() {
    return {
      render: function(filename, code, options) {
        return code;
      }
    };
  });
};
