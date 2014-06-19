module.exports = (classes, mainExports) ->
  'use strict'
  #
  # Simple wrappers for JS and CSS minifiers so that they are easy to change if
  # needed.
  #

  csso = require "csso"

  out = {
    debug: debug = classes.utils.debug("piler:minify")
  }

  UglifyJS = false

  ###istanbul ignore next###
  js = (code) -> code

  ###istanbul ignore catch###
  try
    UglifyJS = require("uglify-js")
  catch

  css = (code, options = {}) ->
    if options.noCache is true
      csso.justDoIt code
    else
      classes.Cache.cache(code, -> csso.justDoIt code)

  ###istanbul ignore else###
  if UglifyJS?
    debug("using uglify")

    js = (code, options = {}) ->
      fnCompress = ->
        ast = UglifyJS.parse code
        ast.figure_out_scope()

        compressor = UglifyJS.Compressor()
        compressed_ast = ast.transform(compressor)

        compressed_ast.figure_out_scope()

        if options.noMangleNames isnt true
          compressed_ast.mangle_names()

        compressed_ast.print_to_string(beautify: false)

      if options.noCache is true
        fnCompress()
      else
        classes.Cache.cache(code, fnCompress)

  minifiers = {}

  ###*
   * Minify code on demand
   * @returns {String}
  ###
  out.minify = mainExports.minify = (ext, code, options, cb) ->
    throw new Error("Minify for '#{ext}' not found") if not ext or not minifiers[ext]
    debug("Minifying code for '#{ext}'")

    classes.utils.Q.try(->
      minifiers[ext](code, options)
    ).nodeify(cb)

  ###*
   * Add your own minifier
   *
   * @function Piler.addMinifier
   * @param {String} ext Extension
   * @param {Piler.factoryFn} factory Function that returns a function
   * @returns {Function} Returns the old minify function, if any
  ###
  out.addMinifier = addMinifier = mainExports.addMinifier = (ext, factoryFn) ->
    oldFn = if minifiers[ext] then minifiers[ext] else ->
    minifiers[ext] = factoryFn(classes)
    oldFn

  do ->
    addMinifier('js', -> js )
    addMinifier('css', -> css )
    return

  ###*
   * Remove a minifier
   *
   * @function Piler.removeMinifier
   * @param {String} ext Extension
  ###
  out.removeMinifier = mainExports.removeMinifier = (ext) ->
    ###istanbul ignore else###
    delete minifiers[ext] if minifiers[ext]

    return

  out