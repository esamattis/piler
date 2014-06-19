module.exports = (classes, mainExports) ->
  'use strict'

  out = {
    debug: debug = classes.utils.debug("piler:compilers")
  }

  coffeescript = require "coffee-script"

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
      render: (filename, code, cb, options) ->
        cb null, code
        return
    js:
      render: (filename, code, cb, options) ->
        cb null, code
        return

    # We always have coffee-script compiler ;)
    coffee:
      render: (filename, code, cb, options) ->
        try
          cb null, coffeescript.compile code
        catch e
          cb e, null
      targetExt: "js"

  ###istanbul ignore else###
  if stylus?
    ###istanbul ignore next###
    compilers.styl =
      targetExt: "css"
      render: (filename, code, cb, options) ->
        stylus(code)
        .set('filename', filename)
        .render cb

    ###istanbul ignore else###
    if nib?
      compilers.styl.render = (filename, code, cb, options) ->
        stylus(code)
        .set('filename', filename)
        .use(nib())
        .render cb


  ###istanbul ignore else###
  if less?
    compilers.less =
      render: (filename, code, cb, options) ->
        less.render code,
          paths: [classes.utils.path.dirname filename]
          cb
      targetExt: "css"

  debug('Available built-in compilers:', Object.keys(compilers).join(', '))

  out.compile = mainExports.compile = (ext, filename, code, cb, options) ->
    throw new Error("Compiler for '#{ext}' not found") if not ext or not compilers[ext]
    debug("Compiling code for '#{ext}'")
    d = classes.utils.Q.defer()

    compilers[ext].render(filename, code, d.callback, options)

    d.promise.nodeify(cb)

  ###*
   * Add a compiler to Piler. You can override existing extensions like css or js
   *
   * @example
   *   piler.addCompiler(function(){
   *     return {
   *       render: function(filename, code, cb){
   *         //do your compilation, then pass it to the callback
   *         cb(null, code);
   *       },
   *       targetExt: 'js'
   *     };
   *   });
   *
   * @function Piler.addCompiler
   *
   * @throws Error
   * @param {String} extension The extension that you want compiling
   * @param {Function} renderFn The function that will be factory for generating code
  ###
  out.addCompiler = addCompiler = mainExports.addCompiler = (extension, renderFn) ->
    throw new Error('addCompiler function expects a function as second parameter') if not classes.utils._.isFunction(renderFn)
    def = renderFn()

    if classes.utils._.isObject(def) and classes.utils._.isFunction(def.render)
      compilers[extension] = def
    else
      throw new Error('Your function must return an object containing "render" and optionally "targetExt"')

    return

  ###*
   * @function Piler.removeCompiler
   * @param {String} extension Extension to remove the compiler
  ###
  out.removeCompiler = mainExports.removeCompiler = (extension) ->
    ###istanbul ignore else###
    delete compilers[extension] if compilers[extension]

    return

  out