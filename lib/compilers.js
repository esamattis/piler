module.exports = function(Piler, mainExports) {
  'use strict';
  var addCompiler, compilers, debug, out;
  out = {
    debug: debug = Piler.utils.debug("piler:compilers")
  };
  compilers = {};
  out.compile = mainExports.compile = function(ext, filename, code, options, cb) {
    if (!ext || !compilers[ext]) {
      throw new Error("Compiler for '" + ext + "' not found");
    }
    debug("Compiling code for '" + ext + "'");
    return compilers[ext].render(filename, code, options).nodeify(cb);
  };

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
   * @function Piler.addCompiler
   *
   * @throws Error
   * @param {String} extension The extension that you want compiling
   * @param {Piler.FactoryFn} renderFn The function that will be factory for generating code
   */
  out.addCompiler = addCompiler = mainExports.addCompiler = function(extension, factoryFn) {
    var def;
    if (!Piler.utils._.isFunction(renderFn)) {
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
