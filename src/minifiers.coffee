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

  css = (code, options = {}) ->
    if options.noCache is true
      csso.justDoIt code
    else
      classes.Cache.cache(code, -> csso.justDoIt code)


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