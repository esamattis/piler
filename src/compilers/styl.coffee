module.exports = (Piler) ->
  stylus = require "stylus"

  Piler.addCompiler('stylus', ->

    obj =
      outputExt: 'css'
      targetExt: ['styl']

      render: (filename, code, options) ->
        options =  Piler.utils._.merge({}, options, {filename: filename})

        Piler.utils.Q (resolve, reject) ->
          stylus(code).set(options).render (err, code)->
            return reject(err) if err
            resolve code
            return

          return

    ###istanbul ignore else###
    if (require.resolve('nib'))
      nib = require('nib')

      obj.render = (filename, code, options) ->

        Piler.utils.Q (resolve, reject) ->
          stylus(code).set(options).render (err, code)->
            return reject(err) if err
            resolve code
            return

          return

    obj
  )

  return
