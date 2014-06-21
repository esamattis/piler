###*
 * @namespace Piler
###

files =
  ###*
   * @namespace Piler.utils
   * @property {Object} _ Lodash
   * @property {Object} path Node.js Path
   * @property {Object} fs {@link http://npmjs.org/package/graceful-fs Graceful-fs}
   * @property {Object} Q {@link http://npmjs.org/package/bluebird Bluebird} promise library
   * @property {Object} objectPath {@link http://npmjs.org/package/object-path objectPath} library
   * @property {Function} debug {@link http://npmjs.org/package/debug Debug} library
   * @property {Array} reserved {@link http://npmjs.org/package/reserved ECMAScript Reserved keywords}
   * @property {Object} multiline {@link http://npmjs.org/package/multiline multiline} library
   * @property {Object} glob {@link http://npmjs.org/package/glob glob} library
   * @property {Function} extension Extract file extension
   * @property {Function} ensureArray Ensure that its an array
  ###
  utils:
    _: require 'lodash'
    path: require 'path'
    fs: require 'graceful-fs'
    Q: require 'bluebird'
    objectPath: require 'object-path'
    debug: require 'debug'
    reserved: require 'reserved'
    multiline: require 'multiline'
    ensureArray: (args) ->
      Array.prototype.concat.call([], args)

    extension: (filename) ->
      parts = filename.split "."
      parts[parts.length - 1]

  AssetUrlParse: require './asseturlparse'
  Minifiers: require './minifiers'
  Cache: require './cache'
  Main: require './main'
  Logger: require './logger'
  Serialize: require './serialize'
  Compilers: require './compilers'

module.exports = files

files.utils._.mixin require 'underscore.string'

files.utils.Q.promisifyAll files.utils.fs

for file of files when file isnt 'utils'
  files[file] = files[file](files, module.exports)

###*
 * `require` a Piler module, inject the classes repository to it and provide options for the module.
 * It actually calls require automatically
 *
 * @function Piler.require
 * @example
 *   // piler module looks like this
 *   module.exports = function(Piler, options) {
 *      // Piler contains all Piler classes (compilers, minifiers, and interfaces to add functionality to Piler)
 *   }
###
module.exports.require = pilerRequire = (path, options = {}) ->
  require("#{path}")(files, options)

###*
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
###
module.exports.use = (factoryFn, options = {}) ->
  factoryFn(files, options)

do ->
  # Built-in compilers
  pilerRequire("./compilers/#{path}") for path in ['coffee','less','styl']
  # Built-in minifiers
  pilerRequire("./minifiers/#{path}") for path in ['uglify','csso']
  # Built-in managers
  pilerRequire("./managers/#{path}") for path in ['js','css','html']
  return

###*
 * @typedef {Function} Piler.FactoryFn
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
###
