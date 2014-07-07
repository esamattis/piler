
/**
 * @namespace Piler
 */
var file, files, pilerRequire;

files = {

  /**
   * @namespace Piler.utils
   * @property {Object} _ Lodash
   * @property {Object} through {@link http://npmjs.org/package/through2 through2} library
   * @property {Object} path Node.js Path
   * @property {Object} fast {@link http://npmjs.org/package/fast.js fast.js} library
   * @property {Object} fs {@link http://npmjs.org/package/graceful-fs Graceful-fs}
   * @property {Object} Promise {@link http://npmjs.org/package/bluebird Bluebird} promise library
   * @property {Object} objectPath {@link http://npmjs.org/package/object-path objectPath} library
   * @property {Function} debug {@link http://npmjs.org/package/debug Debug} library
   * @property {Array} reserved {@link http://npmjs.org/package/reserved ECMAScript Reserved keywords}
   * @property {Object} glob {@link http://npmjs.org/package/glob glob} library
   * @property {Function} extension Extract file extension
   * @property {Function} ensureArray Ensure that its an array
   */
  utils: {
    _: require('lodash'),
    through: require('through2'),
    path: require('path'),
    fast: require('fast.js'),
    fs: require('graceful-fs'),
    Promise: require('bluebird'),
    objectPath: require('object-path'),
    debug: require('debug'),
    glob: require('glob'),
    reserved: require('reserved'),
    ensureArray: function(args) {
      if (!args) {
        return [];
      }
      return files.utils.fast.concat(args);
    },
    extension: function(filename) {
      var parts;
      if (!filename) {
        return '';
      }
      parts = filename.split('.');
      return parts[parts.length - 1];
    }
  },
  AssetUrlParse: require('./asseturlparse'),
  Cache: require('./cache'),
  Main: require('./main'),
  LiveCSS: require('./modules/livecss'),
  Logger: require('./logger'),
  Serialize: require('./serialize'),
  Processors: require('./processors')
};

module.exports = files;

files.utils._.mixin(require('underscore.string'));

files.utils._.mixin(files.utils.fast);

files.utils.Promise.promisifyAll(files.utils.fs);

for (file in files) {
  if (files.utils._.isFunction(files[file])) {
    files[file] = files[file](files, module.exports);
  }
}


/**
 * `require` a Piler module, inject the classes repository to it and provide options for the module.
 * It actually calls require automatically
 *
 * @function Piler.require
 * @example
 *   Piler.require('./file.js');
 *   // then in file.js, piler module looks like this
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
 * Shortcut for Piler.utils.Promise.all. By adding your files using this, you ensure, in
 * production mode, that your hash is always up-to-date
 *
 * @example
 *   Piler.wait([
 *     manager.addFile('somefile'),
 *     manager.addWildcard(['folder/files-*.js','someotherfolder/files*.es6.js'])
 *   ]).done(function(results){
 *     // do something
 *   });
 *
 * @param  {Array} them Promises or values
 * @param  {Piler.NodeCallback} [cb] Use a callback instead
 * @returns {Promise}
 */

module.exports.wait = function(them, cb) {
  them = files.utils.ensureArray(them);
  return files.utils.Promise.all(them).nodeify(cb);
};


/**
 * Render all managers as a single chunk of data
 *
 * @function Piler.all
 *
 * @param {Array.<Piler.Main.PileManager>} managers
 * @param {Piler.NodeCallback} [cb]
 * @returns {Promise}
 */

module.exports.all = function(managers, cb) {
  managers = files.utils.ensureArray(managers);
  return files.utils.Promise.reduce(managers, function(out, manager) {
    return manager.render().then(function(rendered) {
      return out += rendered;
    });
  }, '').nodeify(cb);
};


/**
 * Use a function to add functionality to Piler. All this does is to inject Piler classes and options
 * to the given factory function
 *
 * @function Piler.use
 *
 * @param {Piler.FactoryFn} factoryFn
 * @param {Object} [options={}]
 *
 * @returns {*}
 */

module.exports.use = function(factoryFn, options) {
  if (options == null) {
    options = {};
  }
  return factoryFn(files, options);
};

(function() {
  var path, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
  _ref = ['coffee', 'less', 'styl', 'es6'];
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
 * Function that receives all the classes, and returns a definition object
 *
 * @example
 *   function(Piler, options){
 *     Piler.addManager();
 *     return {
 *     };
 *   }
 *
 * @typedef {Function} Piler.FactoryFn
 *
 * @param {Object} classes All classes from Piler
 * @param {Object} [options={}] Any options
 *
 * @returns {Object} Return a configuration object
 */


/**
 * Normalized node.js callback
 *
 * @example
 *   function(err, result) {
 *     if (err) {
 *       return;
 *     }
 *     result;
 *   }
 *
 * @typedef {Function} Piler.NodeCallback
 * @param {Error} [error] Error if any
 * @param {*} result The result might be always present even when an error occurs
 */
