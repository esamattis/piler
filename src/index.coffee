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
      parts[parts.length-1]

  AssetUrlParse: require './asseturlparse'
  Minify: require './minify'
  Cache: require './cache'
  LiveCSS: require './livecss'
  Piler: require './piler'
  Logger: require './logger'
  Serialize: require './serialize'
  Compilers: require './compilers'

module.exports = files

files.utils._.mixin require 'underscore.string'

for file of files when file isnt 'utils'
  files[file] = files[file](files, module.exports)

