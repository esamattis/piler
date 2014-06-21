
/**
 * @namespace Piler
 */
var file, files, pilerRequire;

files = {

  /**
   * @namespace Piler.utils
   * @property {Object} _ Lodash
   * @property {Object} path Node.js Path
   * @property {Object} fs {@link http://npmjs.org/package/graceful-fs Graceful-fs}
   * @property {Object} Q {@link http://npmjs.org/package/bluebird Bluebird} promise library
   * @property {Object} objectPath {@link http://npmjs.org/package/object-path objectPath} library
   * @property {Function} debug {@link http://npmjs.org/package/debug Debug} library
   * @property {Array} reserved {@link http://npmjs.org/package/reserved ECMAScript Reserved keywords}
   * @property {Object} multiline {@link http://npmjs.org/package/multiline multiline} library
   * @property {Function} extension Extract file extension
   */
  utils: {
    _: require('lodash'),
    path: require('path'),
    fs: require('graceful-fs'),
    Q: require('bluebird'),
    objectPath: require('object-path'),
    debug: require('debug'),
    reserved: require('reserved'),
    multiline: require('multiline'),
    extension: function(filename) {
      var parts;
      parts = filename.split(".");
      return parts[parts.length - 1];
    }
  },
  AssetUrlParse: require('./asseturlparse'),
  Minifiers: require('./minifiers'),
  Cache: require('./cache'),
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
 * `require` a Piler module, inject the classes repository to it and provide options for the module.
 * It actually calls require automatically
 *
 * @function Piler.loadPilerModule
 * @example
 *   // piler module looks like this
 *   module.exports = function(Piler, options) {
 *      // Piler contains all Piler classes (compilers, minifiers, and interfaces to add functionality to Piler)
 *   }
 */

module.exports.require = pilerRequire = function(path, options) {
  if (options == null) {
    options = {};
  }
  return require("" + path)(files, options);
};


/**
 * Use a function to add functionality to Piler. All this does is to inject Piler classes and options
 * to the given factory function
 *
 * @function Piler.use
 * @param {Piler.FactoryFn} factoryFn
 * @param {Object} [options={}]
 * @example
 *   // piler module looks like this
 *   module.exports = function(Piler, options) {
 *      // Piler contains all Piler classes (compilers, minifiers, and interfaces to add functionality to Piler)
 *   }
 */

module.exports.use = function(factoryFn, options) {
  if (options == null) {
    options = {};
  }
  return factoryFn(files, options);
};

(function() {
  var path, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
  _ref = ['coffee', 'less', 'styl'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    path = _ref[_i];
    pilerRequire("./compilers/" + path);
  }
  _ref1 = ['uglify', 'csso'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    path = _ref1[_j];
    pilerRequire("./minifiers/" + path);
  }
  _ref2 = ['js', 'css', 'html'];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    path = _ref2[_k];
    pilerRequire("./managers/" + path);
  }
})();


/**
 * @typedef {Function} Piler.FactoryFn
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
 */
