'use strict'

coffeescript = require "coffee-script"
path = require "path"
_ = require 'lodash'
debug = require("debug")("piler:compilers")

###istanbul ignore next ###
try
  stylus = require "stylus"
catch e

###istanbul ignore next ###
try
  nib = require "nib"
catch e

###istanbul ignore next ###
try
  less = require "less"
catch e

compilers =
  # Dummy compilers
  css:
    render: (filename, code, cb) ->
      cb null, code
      return
  js:
    render: (filename, code, cb) ->
      cb null, code
      return

  # We always have coffee-script compiler ;)
  coffee:
    render: (filename, code, cb) ->
      try
        cb null, coffeescript.compile code
      catch e
        cb e, null
    targetExt: "js"

###istanbul ignore else###
if stylus?
  ###istanbul ignore next###
  compilers.styl =
    targetExt: "css"
    render: (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .render cb

  ###istanbul ignore else###
  if nib?
    compilers.styl.render = (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .use(nib())
      .render cb


###istanbul ignore else###
if less?
  compilers.less =
    render: (filename, code, cb) ->
      less.render code,
        paths: [path.dirname filename]
        cb
    targetExt: "css"

debug('Available built-in compilers:', Object.keys(compilers).join(', '))

module.exports.compile = (ext, code, options) ->
  throw new Error("Minify for '#{ext}' not found") if not ext or not minifiers[ext]
  debug("Compiling code for '#{ext}'")
  minifiers[ext](code, options)

###*
 * Add a compiler to Piler. You can override existing extensions like css or js
 *
 * @example
 *   piler.addCompiler(function(){
 *     return {
 *       render: function(filename, code, cb){
 *         //do your compilation, then pass it to the callback
 *         cb(null, code);
 *       },
 *       targetExt: 'js'
 *     };
 *   });
 *
 * @function Piler.addCompiler
 *
 * @throws Error
 * @param {String} extension The extension that you want compiling
 * @param {Function} renderFn The function that will be factory for generating code
###
module.exports.addCompiler = addCompiler = (extension, renderFn) ->
  throw new Error('addCompiler function expects a function as second parameter') if not _.isFunction(renderFn)
  def = renderFn()

  if _.isObject(def) and _.isFunction(def.render)
    compilers[extension] = def
  else
    throw new Error('Your function must return an object containing "render" and optionally "targetExt"')

  return

###*
 * @function Piler.removeCompiler
 * @param {String} extension Extension to remove the compiler
###
module.exports.removeCompiler = (extension) ->
  ###istanbul ignore else###
  delete compilers[extension] if compilers[extension]

  return
