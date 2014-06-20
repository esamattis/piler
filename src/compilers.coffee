module.exports = (Piler, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Compilers
  ###

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Compilers}
     * @function Piler.Compilers.debug
    ###
    debug: debug = Piler.utils.debug("piler:compilers")
  }

  compilers = {}

  ###*
   * @function Piler.compile
  ###
  ###*
   * Compile some code
   *
   * @function Piler.Compilers.compile
   * @param {String} ext
   * @param {String} filename
   * @param {String} code
   * @param {Object} [options]
   * @param {Function} [cb]
   * @returns {Promise}
  ###
  out.compile = mainExports.compile = (ext, filename, code, options, cb) ->
    throw new Error("Compiler for '#{ext}' not found") if not ext or not compilers[ext]
    debug("Compiling code for '#{ext}'")

    compilers[ext].render(filename, code, options).nodeify(cb)

  ###*
   * @function Piler.addCompiler
  ###
  ###*
   * Add a compiler to Piler. You can override existing extensions like css or js
   *
   * @example
   *   piler.addCompiler(function(classes){
   *     return {
   *       render: function(filename, code){
   *         // do your compilation.
   *         // the return value of this function can be a promise
   *         // you can use classes.utils.Q.defer() to create a promise as well
   *         //
   *         // You can also throw Error in here
   *         return code;
   *       },
   *       targetExt: 'js'
   *     };
   *   });
   *
   * @function Piler.Compilers.addCompiler
   *
   * @throws Error
   * @param {String} extension The extension that you want compiling
   * @param {Piler.FactoryFn} renderFn The function that will be factory for generating code
  ###
  out.addCompiler = addCompiler = mainExports.addCompiler = (extension, factoryFn) ->
    throw new Error('addCompiler function expects a function as second parameter') if not Piler.utils._.isFunction(factoryFn)
    def = factoryFn(Piler)

    if Piler.utils._.isObject(def) and Piler.utils._.isFunction(def.render)
      # make the render function always a promise
      def.render = Piler.utils.Q.method def.render
      compilers[extension] = def
    else
      throw new Error('Your function must return an object containing "render" and optionally "targetExt"')

    return

  ###*
   * @function Piler.removeCompiler
  ###
  ###*
   * @function Piler.Compilers.removeCompiler
   * @param {String} extension Extension to remove the compiler
  ###
  out.removeCompiler = mainExports.removeCompiler = (extension) ->
    ###istanbul ignore else###
    delete compilers[extension] if compilers[extension]

    return

  out