module.exports = function(Piler) {
  Piler.addCompiler('js', function() {
    return {
      render: function(filename, code, options) {
        return code;
      }
    };
  });
};
