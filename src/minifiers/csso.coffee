module.exports = (Piler) ->
  csso = require('csso')

  Piler.addProcessor('csso', ->

    {
      post: {
        render: (code, asset, options) ->
          csso.justDoIt(code, options.structures)

        defaults: {structures: false}

        condition: (asset, options) ->
          (asset.options.filePath and asset.options.filePath.indexOf('.min') is -1 and Piler.utils.extension(asset.options.filePath) is 'css') and
          (asset.options.env is 'production')
      }
    }
  )

  return