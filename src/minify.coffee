#
# Simple wrappers for JS and CSS minifiers so that they are easy to change if
# needed.
#
'use strict'

csso = require "csso"
debug = require("debug")("piler:minify")
cache = require './cache'

UglifyJS = false

try
  UglifyJS = require("uglify-js")
catch error
  # uglify-js' packaging currently sucks. Add fallback.
  debug("no uglify", error)
  exports.js = (code) -> code

exports.css = (code, options = {}) ->
  if options.noCache is true
    csso.justDoIt code
  else
    cache(code, -> csso.justDoIt code)

if UglifyJS?
  debug("using uglify")

  exports.js = (code, options = {}) ->
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
