module.exports = function(Piler, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Compilers
   */
  var addCompiler, compilers, debug, out;
  out = {

    /**
     * Output debug messages as if it was from {@link Piler.Compilers}
     * @function Piler.Compilers.debug
     */
    debug: debug = Piler.utils.debug("piler:compilers")
  };
  compilers = {};

  /**
   * @function Piler.compile
   */

  /**
   * Compile some code
   *
   * @function Piler.Compilers.compile
   * @param {String} ext
   * @param {String} filename
   * @param {String} code
   * @param {Object} [options]
   * @param {Function} [cb]
   * @returns {Promise}
   */
  out.compile = mainExports.compile = function(ext, filename, code, options, cb) {
    if (!ext || !compilers[ext]) {
      throw new Error("Compiler for '" + ext + "' not found");
    }
    debug("Compiling code for '" + ext + "'");
    return compilers[ext].render(filename, code, options).nodeify(cb);
  };

  /**
   * @function Piler.addCompiler
   */

  /**
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
   */
  out.addCompiler = addCompiler = mainExports.addCompiler = function(extension, factoryFn) {
    var def;
    if (!Piler.utils._.isFunction(factoryFn)) {
      throw new Error('addCompiler function expects a function as second parameter');
    }
    def = factoryFn(Piler);
    if (Piler.utils._.isObject(def) && Piler.utils._.isFunction(def.render)) {
      def.render = Piler.utils.Q.method(def.render);
      compilers[extension] = def;
    } else {
      throw new Error('Your function must return an object containing "render" and optionally "targetExt"');
    }
  };

  /**
   * @function Piler.removeCompiler
   */

  /**
   * @function Piler.Compilers.removeCompiler
   * @param {String} extension Extension to remove the compiler
   */
  out.removeCompiler = mainExports.removeCompiler = function(extension) {

    /*istanbul ignore else */
    if (compilers[extension]) {
      delete compilers[extension];
    }
  };
  return out;
};
