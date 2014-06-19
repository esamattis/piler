module.exports = (Piler) ->
  stylus = require "stylus"

  Piler.addCompiler('styl', ->
    obj =
      targetExt: "css"
      render: (filename, code, options) ->
        options =  Piler.utils._.merge({}, options, {filename: filename})

        styl = stylus(code).set(options)
        (Piler.utils.Q.promisify styl.render, styl)()

    ###istanbul ignore else###
    if (require.resolve('nib'))
      nib = require('nib')

      obj.render = (filename, code, options) ->
        options =  Piler.utils._.merge({}, options, {filename: filename})
        styl = stylus(code).set(options).use(nib())

        (Piler.utils.Q.promisify styl.render, styl)()

    obj
  )

  return
