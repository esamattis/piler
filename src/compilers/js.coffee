module.exports = (Piler) ->
  Piler.addCompiler('js', ->
    render: (filename, code, options) ->
      code
  )

  return