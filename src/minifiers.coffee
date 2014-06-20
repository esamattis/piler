module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Minifiers
  ###

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Minifiers}
     * @function Piler.Minifiers.debug
    ###
    debug: debug = classes.utils.debug("piler:minifiers")
  }

  minifiers = {}

  ###*
   * @function Piler.minify
  ###
  ###*
   * Minify code on demand
   *
   * @function Piler.Minifiers.minify
   * @returns {String}
  ###
  out.minify = mainExports.minify = (ext, code, options, cb) ->
    throw new Error("Minify for '#{ext}' not found") if not ext or not minifiers[ext]
    debug("Minifying code for '#{ext}'")

    classes.utils.Q.try(->
      minifiers[ext](code, options)
    ).nodeify(cb)

  ###*
   * @function Piler.addMinifier
  ###
  ###*
   * Add your own minifier
   *
   * @function Piler.Minifiers.addMinifier
   * @param {String} ext Extension
   * @param {Piler.FactoryFn} factoryFn Function that returns a function
   * @returns {Function} Returns the old minify function, if any
  ###
  out.addMinifier = mainExports.addMinifier = (ext, factoryFn) ->
    oldFn = if minifiers[ext] then minifiers[ext] else ->
    minifiers[ext] = factoryFn(classes)
    oldFn

  ###*
   * @function Piler.removeMinifier
  ###
  ###*
   * Remove a minifier
   *
   * @function Piler.Minifiers.removeMinifier
   * @param {String} ext Extension
  ###
  out.removeMinifier = mainExports.removeMinifier = (ext) ->
    ###istanbul ignore else###
    delete minifiers[ext] if minifiers[ext]

    return

  out