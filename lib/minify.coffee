

try
  uglify = require("uglify-js")
catch error
  # uglify-js' packaging currently sucks. Add fallback.
  console.log "no uglify", error
  exports.minify = (code) -> code
  exports.beautify = (code) -> code

if uglify?
  jsp = uglify.parser
  pro = uglify.uglify

  exports.minify = (code) ->
    ast = jsp.parse(code)
    mangled = pro.ast_mangle(ast)
    ast = pro.ast_squeeze mangled
    pro.gen_code ast

  exports.beautify = (code) ->
    ast = jsp.parse(code)
    pro.gen_code ast, beautify: true


