module.exports = (Piler) ->
  coffeescript = require('coffee-script')

  Piler.addProcessor('coffeescript', ->

    {
      pre: {
        render: (code, asset, options) ->
          coffeescript.compile(code, options)

        condition: (asset, options) ->
          (asset.options.filePath and Piler.utils.extension(asset.options.filePath) is 'coffee')
      }
    }
  )

  return