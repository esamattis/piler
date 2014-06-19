#
# Simple wrappers for JS and CSS minifiers so that they are easy to change if
# needed.
#
'use strict'

csso = require "csso"
debug = require("debug")("piler:minify")
cache = require './cache'

UglifyJS = false

###istanbul ignore next###
js = (code) -> code

###istanbul ignore catch###
try
  UglifyJS = require("uglify-js")
catch

css = (code, options = {}) ->
  if options.noCache is true
    csso.justDoIt code
  else
    cache(code, -> csso.justDoIt code)

###istanbul ignore else###
if UglifyJS?
  debug("using uglify")

  js = (code, options = {}) ->
    fnCompress = ->
      ast = UglifyJS.parse code
      ast.figure_out_scope()

      compressor = UglifyJS.Compressor()
      compressed_ast = ast.transform(compressor)

      compressed_ast.figure_out_scope()

      if options.noMangleNames isnt true
        compressed_ast.mangle_names()

      compressed_ast.print_to_string(beautify: false)

    if options.noCache is true
      fnCompress()
    else
      cache(code, fnCompress)

minifiers = {}

module.exports.minify = (ext, code, options) ->
  throw new Error("Minify for '#{ext}' not found") if not ext or not minifiers[ext]
  debug("Minifying code for '#{ext}'")
  minifiers[ext](code, options)

###*
 * @typedef {Function} Piler.minifyFactory
 * @returns {{render:Function}}
###
###*
 * Add your own minifier
 *
 * @function Piler.addMinifier
 * @param {String} ext Extension
 * @param {Piler.minifyFactory} factory Function that returns a function
 * @returns {Function} Returns the old minify function, if any
###
module.exports.addMinifier = addMinifier = (ext, factory) ->
  oldFn = if minifiers[ext] then minifiers[ext] else ->
  minifiers[ext] = factory()
  oldFn

do ->
  addMinifier('js', -> js )
  addMinifier('css', -> css )
  return

###*
 * Remove a minifier
 *
 * @function Piler.removeMinifier
 * @param {String} ext Extension
###
module.exports.removeMinifier = (ext) ->
  ###istanbul ignore else###
  delete minifiers[ext] if minifiers[ext]

  return