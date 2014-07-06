module.exports = (Piler) ->
  stylus = require('stylus')

  Piler.addProcessor('stylus', ->
    render = undefined

    ###istanbul ignore next: wont exist in tests###
    render = (code, asset, options) ->
      if asset and asset.options.filePath
        options = Piler.utils._.merge({}, options, {filename: asset.options.filePath})

      new Piler.utils.Promise((resolve, reject) ->
        stylus(code, options).render((err, code) ->
          return reject(err) if err
          resolve(code)
          return
        )
        return
      )

    obj = {
      pre: {
        render: render
        condition: (asset, options) ->
          (asset.options.filePath and Piler.utils.extension(asset.options.filePath) is 'styl')
      }
    }

    ###istanbul ignore catch###
    try
      nib = require('nib')

      obj.pre.render = (code, asset, options) ->
        new Piler.utils.Promise((resolve, reject) ->
          if asset.options.filePath
            options = Piler.utils._.merge({}, options, {filename: asset.options.filePath})

          stylus(code, options).use(nib()).render((err, code)->
            return reject(err) if err
            resolve(code)
            return
          )
          return
        )
    catch

    obj
  )

  return
