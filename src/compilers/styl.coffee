module.exports = (Piler) ->
  stylus = require "stylus"

  Piler.addCompiler('stylus', ->

    obj =
      on:
        file:
          object: ['styl']

      targetExt: 'css'

      execute: (code, filename, options) ->
        options =  Piler.utils._.merge({}, options, {filename: filename})

        new Piler.utils.Q (resolve, reject) ->
          stylus(code).set(options).render (err, code)->
            return reject(err) if err
            resolve code
            return

          return

    ###istanbul ignore catch###
    try
      nib = require('nib')

      obj.execute = (code, filename, options) ->

        new Piler.utils.Q (resolve, reject) ->
          options =  Piler.utils._.merge({}, options, {filename: filename})

          stylus(code).set(options).use(nib()).render (err, code)->
            return reject(err) if err
            resolve code
            return

          return
    catch

    obj
  )

  return
