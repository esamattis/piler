###*
 * @namespace Piler
###

files =
  ###*
   * @namespace Piler.utils
   * @property {Object} _ Lodash
   * @property {Object} path Node.js Path
   * @property {Object} fs Graceful-fs
   * @property {Object} Q Promise library
   * @property {Function} debug Debug library
   * @property {Array} reserved ECMAScript Reserved keywords
   * @property {Function} extension Extract file extension
  ###
  utils:
    _: require 'lodash'
    path: require 'path'
    fs: require 'graceful-fs'
    Q: require 'bluebird'
    debug: require 'debug'
    reserved: require 'reserved'
    extension: (filename) ->
      parts = filename.split "."
      parts[parts.length - 1]

  AssetUrlParse: require './asseturlparse'
  Minifiers: require './minifiers'
  Cache: require './cache'
  LiveCSS: require './livecss'
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
 * `require` a Piler module, inject the classes repository to it and provide options for the module
 *
 * @function Piler.loadPilerModule
 * @example
 *   // piler module looks like this
 *   module.exports = function(Piler, options) {
 *      // Piler contains all Piler classes (compilers, minifiers, and interfaces to add functionality to Piler)
 *   }
###
module.exports.loadPilerModule = loadPilerModule = (path, options = {}) ->
  require("#{path}")(files, options)

do ->
  # Built-in compilers
  loadPilerModule("./compilers/#{path}") for path in ['coffee','less','styl','js','css']
  # Built-in minifiers
  loadPilerModule("./minifiers/#{path}") for path in ['uglify','csso']
  # Built-in managers
  loadPilerModule("./managers/#{path}") for path in ['js','css']
  return

###*
 * @typedef {Function} Piler.FactoryFn
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
###
