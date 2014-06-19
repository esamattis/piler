module.exports = (Piler, mainExports) ->
  'use strict'

  out = {
    debug: debug = Piler.utils.debug("piler:compilers")
  }

  compilers = {}

  out.compile = mainExports.compile = (ext, filename, code, options, cb) ->
    throw new Error("Compiler for '#{ext}' not found") if not ext or not compilers[ext]
    debug("Compiling code for '#{ext}'")

    compilers[ext].render(filename, code, options).nodeify(cb)

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
   * @function Piler.addCompiler
   *
   * @throws Error
   * @param {String} extension The extension that you want compiling
   * @param {Piler.FactoryFn} renderFn The function that will be factory for generating code
  ###
  out.addCompiler = addCompiler = mainExports.addCompiler = (extension, factoryFn) ->
    throw new Error('addCompiler function expects a function as second parameter') if not Piler.utils._.isFunction(renderFn)
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
   * @param {String} extension Extension to remove the compiler
  ###
  out.removeCompiler = mainExports.removeCompiler = (extension) ->
    ###istanbul ignore else###
    delete compilers[extension] if compilers[extension]

    return

  out