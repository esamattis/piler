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
   * @param {String} name
   * @param {String} filename
   * @param {String} code
   * @param {Object} [options]
   * @param {Function} [cb]
   * @returns {Promise}
  ###
  out.compile = mainExports.compile = (name, filename, code, options, cb) ->
    throw new Error("Compiler '#{name}' not found") if not name or not compilers[name]
    debug("Compiling code '#{name}'")

    compilers[name].render(filename, code, options).nodeify(cb)

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
   *         //
   *         // you can return synchronously or can return a promise
   *         // if you want, you can classes.utils.Q(function(resolve, reject){}) to create a promise as well
   *         //
   *         // You can also throw Error safely in here
   *         return code;
   *       },
   *       // if you don't set targetExt, it will be applied to everything that
   *       // passes to this compiler
   *       targetExt: ['ls'],
   *       // this is only used when saving to output directory
   *       outputExt: 'js'
   *     };
   *   });
   *
   * @function Piler.Compilers.addCompiler
   *
   * @throws Error
   * @param {String} name The name of the compiler
   * @param {Piler.FactoryFn} renderFn The function that will be factory for generating code
  ###
  out.addCompiler = addCompiler = mainExports.addCompiler = (name, factoryFn) ->
    throw new Error('addCompiler function expects a function as second parameter') if not Piler.utils._.isFunction(factoryFn)
    def = factoryFn(Piler)

    if Piler.utils._.isObject(def) and Piler.utils._.isFunction(def.render) and (typeof def.targetExt isnt undefined)
      def.targetExt = Array.prototype.concat.call([], def.targetExt)
      debug('Added compiler', name, def.targetExt)
      # make the render function always a promise
      def.render = Piler.utils.Q.method def.render
      compilers[name] = def
    else
      throw new Error('Your function must return an object containing "render" and "targetExt" and optionally "outputExt"')

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