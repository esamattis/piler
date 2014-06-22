module.exports = (Piler) ->
  coffeescript = require 'coffee-script'

  Piler.addCompiler('coffeescript', ->

    # We always have coffee-script compiler ;)
    execute: (code, filename, options) ->
      coffeescript.compile code, options

    on:
      file:
        object: ['coffee']

    targetExt: 'js'
  )

  return