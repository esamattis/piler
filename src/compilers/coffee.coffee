module.exports = (Piler) ->
  coffeescript = require 'coffee-script'

  Piler.addCompiler('coffeescript', ->
    # We always have coffee-script compiler ;)
    render: (filename, code, options) ->
      coffeescript.compile code, options

    targetExt: ['coffee']
    outputExt: 'js'
  )

  return