###
 * @namespace Piler
###

files =
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
  Piler: require './piler'
  Logger: require './logger'
  Serialize: require './serialize'
  Compilers: require './compilers'

module.exports = files

files.utils._.mixin require 'underscore.string'

files.utils.Q.promisifyAll files.utils.fs

for file of files when file isnt 'utils'
  files[file] = files[file](files, module.exports)

do ->
  # Built-in compilers
  require("./compilers/#{compilerPath}")(files) for compilerPath in ['coffee','less','styl','js','css']
  return

###*
 * @typedef {Function} Piler.FactoryFn
 * @callback
 * @param {Object} classes All classes from Piler
 * @returns {Object} Return a configuration object
###
