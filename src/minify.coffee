#
# Simple wrappers for JS and CSS minifiers so that they are easy to change if
# needed.
#
'use strict'

csso = require "csso"
debug = require("debug")("piler:minify")

try
  UglifyJS = require("uglify-js")
catch error
  # uglify-js' packaging currently sucks. Add fallback.
  debug("no uglify", error)
  exports.jsMinify = (code) -> code
  exports.jsBeautify = (code) -> code

exports.cssMinify = (code) -> csso.justDoIt code

if UglifyJS?

  exports.jsMinify = (code) ->
    ast = UglifyJS.parse code
    ast.figure_out_scope()
    compressor = UglifyJS.Compressor()
    compressed_ast = ast.transform(compressor)

    compressed_ast.figure_out_scope()
    compressed_ast.mangle_names()
    compressed_ast.print_to_string(beautify: false)

  exports.jsBeautify = (code) ->
    ast = UglifyJS.parse code
    ast.figure_out_scope()
    ast.print_to_string(beautify: true)

