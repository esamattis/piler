coffeescript = require "coffee-script"
csso = require "csso"

try
  stylus = require "stylus"
catch e

try
  nib = require "nib"
catch e

try
  less = require "less"
catch e

production = process.env.NODE_ENV is "production"

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
      .set('compress', if production then true else false)
      .render cb

  if nib?
    Renderer = require "stylus/lib/renderer"
    compilers.styl.render = (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .set('compress', if production then true else false)
      .use(do nib)
      .render cb


if less?
  compilers.less =
    render: (filename, code, cb) ->
      less.render code, (err, css) ->
        cb(err) if err
        if production
          cb null, csso.justDoIt code
        else
          cb null, css
    targetExt: "css"


module.exports = compilers
