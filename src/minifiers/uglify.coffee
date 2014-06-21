module.exports = (Piler) ->
  UglifyJS = require("uglify-js")

  Piler.addMinifier('uglify', ->
    (code, options = {}) ->

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
        Piler.Cache.cache(code, fnCompress)
  )

  return