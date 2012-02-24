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
    render: (filename, code, cb) -> cb null, code
  js:
    render: (filename, code, cb) -> cb null, code

  # We always have coffee-script compiler ;)
  coffee:
    render: (filename, code, cb) ->
      try
        cb null, coffeescript.compile code
      catch e
        cb e, null
    targetExt: "js"

if stylus?
  compilers.styl =
    targetExt: "css"
    render: (code, cb) ->
      stylus(code)
      .set('filename', filename)
      .render cb

  if nib?
    Renderer = require "stylus/lib/renderer"
    compilers.styl.render = (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .use(do nib)
      .render cb


if less?
  compilers.less =
    render: (filename, code, cb) ->
      less.render code, cb
    targetExt: "css"


module.exports = compilers
