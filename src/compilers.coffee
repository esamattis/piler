'use strict'

coffeescript = require "coffee-script"
path = require "path"
debug = require("debug")("piler:compilers")

###istanbul ignore next ###
try
  stylus = require "stylus"
catch e

###istanbul ignore next ###
try
  nib = require "nib"
catch e

###istanbul ignore next ###
try
  less = require "less"
catch e

compilers =
  # Dummy compilers
  css:
    render: (filename, code, cb) ->
      cb null, code
      return
  js:
    render: (filename, code, cb) ->
      cb null, code
      return

  # We always have coffee-script compiler ;)
  coffee:
    render: (filename, code, cb) ->
      try
        cb null, coffeescript.compile code
      catch e
        cb e, null
    targetExt: "js"

###istanbul ignore else###
if stylus?
  compilers.styl =
    targetExt: "css"
    render: (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .render cb

  ###istanbul ignore else###
  if nib?
    Renderer = require "stylus/lib/renderer"
    compilers.styl.render = (filename, code, cb) ->
      stylus(code)
      .set('filename', filename)
      .use(do nib)
      .render cb


###istanbul ignore else###
if less?
  compilers.less =
    render: (filename, code, cb) ->
      less.render code,
        paths: [path.dirname filename]
        cb
    targetExt: "css"

debug('Available built-in compilers:', Object.keys(compilers).join(', '))

module.exports = compilers
