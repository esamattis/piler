module.exports = (Piler) ->
  csso = require "csso"

  Piler.addMinifier('csso', ->

    (code, options = {}) ->
        if options.noCache is true
          csso.justDoIt code
        else
          Piler.Cache.cache(code, -> csso.justDoIt code)
  )

  return