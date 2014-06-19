module.exports = (Piler) ->

  Piler.addCompiler('css', ->
    render: (filename, code, options) ->
      code
  )

  return