module.exports = (Piler) ->
  coffeescript = require "coffee-script"

  Piler.addCompiler('coffee', ->
    # We always have coffee-script compiler ;)
    render: (filename, code, options) ->
      coffeescript.compile code, options

    targetExt: "js"
  )

  return