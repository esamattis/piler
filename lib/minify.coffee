#
# Simple wrappers for JS and CSS minifiers so that they are easy to change if
# needed.
#

csso = require "csso"

try
  uglify = require("uglify-js")
catch error
  # uglify-js' packaging currently sucks. Add fallback.
  console.log "no uglify", error
  exports.jsMinify = (code) -> code
  exports.jsBeautify = (code) -> code


exports.cssMinify = (code) -> csso.justDoIt code



if uglify?
  jsp = uglify.parser
  pro = uglify.uglify

  exports.jsMinify = (code) ->
    ast = jsp.parse code
    ast = pro.ast_mangle ast
    ast = pro.ast_squeeze ast
    pro.gen_code ast

  exports.jsBeautify = (code) ->
    ast = jsp.parse(code)
    pro.gen_code ast, beautify: true


