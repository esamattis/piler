
/**
 * @namespace Piler
 */
var file, files, loadPilerModule;

files = {

  /**
   * @namespace Piler.utils
   * @property {Object} _ Lodash
   * @property {Object} path Node.js Path
   * @property {Object} fs Graceful-fs
   * @property {Object} Q Promise library
   * @property {Function} debug Debug library
   * @property {Array} reserved ECMAScript Reserved keywords
   * @property {Function} extension Extract file extension
   */
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
  Main: require('./main'),
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


/**
 * `require` a Piler module, inject the classes repository to it and provide options for the module
 *
 * @function Piler.loadPilerModule
 * @example
 *   // piler module looks like this
 *   module.exports = function(Piler, options) {
 *      // Piler contains all Piler classes (compilers, minifiers, and interfaces to add functionality to Piler)
 *   }
 */

module.exports.loadPilerModule = loadPilerModule = function(path, options) {
  if (options == null) {
    options = {};
  }
  return require("" + path)(files, options);
};

(function() {
  var path, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
  _ref = ['coffee', 'less', 'styl', 'js', 'css'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    path = _ref[_i];
    loadPilerModule(path);
  }
  _ref1 = ['uglify', 'csso'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    path = _ref1[_j];
    loadPilerModule(path);
  }
  _ref2 = ['js', 'css'];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    path = _ref2[_k];
    loadPilerModule(path);
  }
})();


/**
 * @typedef {Function} Piler.FactoryFn
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
 */
