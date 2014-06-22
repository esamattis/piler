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
  out.compile = mainExports.compile = (name, code, filename, options, cb) ->
    throw new Error("Compiler '#{name}' not found") if not name or not compilers[name]
    debug("Compiling code '#{name}'")

    compilers[name].execute(code, filename, options).nodeify(cb)

  ###*
   * @function Piler.addCompiler
  ###
  ###*
   * Add a compiler to Piler. You can override existing extensions like css or js
   *
   * @example
   *   piler.addCompiler(function(Piler){
   *     return {
   *       execute: function(codem filename, options){
   *         // do your compilation.
   *         //
   *         // you can return synchronously or can return a promise
   *         // if you want, you can
   *
   *         // new Piler.utils.Q(function(resolve, reject){})
   *
   *         // to create a promise as well
   *         //
   *         // You can also throw Error safely in here
   *         return code;
   *       },
   *       // this is the trigger for this compiler, matches the path of the "file" type to have .ls extension
   *       // you can use an array of strings or regexes, a string, a regex, a boolean or a function
   *       on: {
   *         file: '.ls'
   *       },
   *       // this is only used when saving to output directory
   *       targetExt: 'js'
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
    throw new Error('Missing name for compiler') if not name
    throw new Error('addCompiler function expects a function as second parameter') if not Piler.utils._.isFunction(factoryFn)

    def = factoryFn(Piler)

    throw new Error("Missing 'on' for compiler #{name}") if not def.on
    throw new Error("Missing 'execute' function for compiler #{name}") if not Piler.utils._.isFunction(def.execute)

    debug('Added', name, def.on)
    # make the render function always a promise
    def.execute = Piler.utils.Q.method def.execute
    compilers[name] = def

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