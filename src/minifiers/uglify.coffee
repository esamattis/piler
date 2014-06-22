module.exports = (Piler) ->
  UglifyJS = require("uglify-js")

  Piler.addMinifier('uglify', ->
    {
      execute: (code, options = {}) ->
        ast = UglifyJS.parse code
        ast.figure_out_scope()

        compressor = UglifyJS.Compressor()
        compressed_ast = ast.transform(compressor)

        compressed_ast.figure_out_scope()

        if options.noMangleNames isnt true
          compressed_ast.mangle_names()

        options.beautify ?= false

        compressed_ast.print_to_string(options)

      on:
        file:
          object: ['js']

    }

  )

  return