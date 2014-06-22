module.exports = (Piler) ->
  csso = require "csso"

  Piler.addMinifier('csso', ->

    {
      execute: (code, options = {}) ->
        csso.justDoIt code
      on: {
        file: {
          object: ['css']
        }
      }
    }
  )

  return