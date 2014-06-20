module.exports = (Piler) ->
  less = require "less"

  render = Piler.utils.Q.promisify less.render, less

  Piler.addCompiler('less', ->
    render: (filename, code, options) ->
      render code, Piler.utils._.merge({}, options, paths: [Piler.utils.path.dirname filename])

    targetExt: "css"
  )

  return

