coffeescript = require "coffee-script"

try
  stylus = require "stylus"
catch e

try
  nib = require "nib"
catch e

try
  less = require "less"
catch e

compilers =
  # Dummy compilers
  css:
    render: (code, cb) -> cb null, code
  js:
    render: (code, cb) -> cb null, code

  # We always have coffee-script compiler ;)
  coffee:
    render: (code, cb) ->
      try
        cb null, coffeescript.compile code
      catch e
        cb e, null
    targetExt: "js"


if stylus?
  compilers.styl =
    render: stylus.render
    targetExt: "css"

  if nib?
    Renderer = require "stylus/lib/renderer"
    compilers.styl.render = (code, cb) ->
      renderer = new Renderer code
      renderer.use nib()
      renderer.render cb


if less?
  compilers.less =
    render: (code, cb) ->
      less.render code, cb
    targetExt: "css"


module.exports = compilers
