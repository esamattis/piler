module.exports = (Piler) ->
  UglifyJS = require('uglify-js')

  Piler.addProcessor('uglify', ->

    {
      post: {
        render: (code, asset, options) ->
          options = Piler.utils._.merge(options, {fromString: true})
          UglifyJS.minify(code, options).code

        defaults: {mangle: true, compress:{}}

        condition: (asset, options) ->
          (asset.options.filePath and asset.options.filePath.indexOf('.min') is -1 and Piler.utils.extension(asset.options.filePath) is 'js') and
          (asset.options.env is 'production')
      }
    }
  )

  return