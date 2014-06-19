
/*
 * @namespace Piler
 */
var file, files;

files = {
  utils: {
    _: require('lodash'),
    path: require('path'),
    fs: require('graceful-fs'),
    Q: require('bluebird'),
    debug: require('debug'),
    reserved: require('reserved'),
    extension: function(filename) {
      var parts;
      parts = filename.split(".");
      return parts[parts.length - 1];
    }
  },
  AssetUrlParse: require('./asseturlparse'),
  Minifiers: require('./minifiers'),
  Cache: require('./cache'),
  LiveCSS: require('./livecss'),
  Piler: require('./piler'),
  Logger: require('./logger'),
  Serialize: require('./serialize'),
  Compilers: require('./compilers')
};

module.exports = files;

files.utils._.mixin(require('underscore.string'));

files.utils.Q.promisifyAll(files.utils.fs);

for (file in files) {
  if (file !== 'utils') {
    files[file] = files[file](files, module.exports);
  }
}

(function() {
  var compilerPath, _i, _len, _ref;
  _ref = ['coffee', 'less', 'styl', 'js', 'css'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    compilerPath = _ref[_i];
    require("./compilers/" + compilerPath)(files);
  }
})();


/**
 * @typedef {Function} Piler.FactoryFn
 * @callback
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
 */
