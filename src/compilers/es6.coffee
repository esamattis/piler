module.exports = (Piler) ->
  traceur = require('traceur')

  Piler.addProcessor('es6', ->

    {
      pre: {
        render: (code, asset, options) ->
          traceur.compile(code, options).js

        condition: (asset, options) ->
          (asset.options.filePath and asset.options.filePath.indexOf('es6') isnt -1)

        defaults: {
          modules: 'commonjs'
        }
      }
    }
  )

  return