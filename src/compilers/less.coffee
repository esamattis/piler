module.exports = (Piler) ->
  less = require('less')

  render = Piler.utils.Promise.promisify(less.render, less)

  Piler.addProcessor('less', ->
    {
      pre: {
        render: (code, asset, options) ->
          render(code, Piler.utils._.merge({}, options, {paths: if asset and asset.options.filePath then [Piler.utils.path.dirname(asset.options.filePath)] else []}))

        condition: (asset, options) ->
          (asset.options.filePath and Piler.utils.extension(asset.options.filePath) is 'less')
      }
    }

  )

  return

