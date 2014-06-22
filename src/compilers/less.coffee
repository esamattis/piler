module.exports = (Piler) ->
  less = require 'less'

  render = Piler.utils.Q.promisify less.render, less

  Piler.addCompiler('less', ->
    execute: (code, filename, options) ->
      render code, Piler.utils._.merge({}, options, paths: [Piler.utils.path.dirname filename])

    on:
      file:
        object: ['less']

    targetExt: 'css'
  )

  return

