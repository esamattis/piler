module.exports = function(classes, mainExports) {
  'use strict';
  var addCompiler, coffeescript, compilers, debug, e, less, nib, out, stylus;
  out = {
    debug: debug = classes.utils.debug("piler:compilers")
  };
  coffeescript = require("coffee-script");

  /*istanbul ignore next */
  try {
    stylus = require("stylus");
  } catch (_error) {
    e = _error;
  }

  /*istanbul ignore next */
  try {
    nib = require("nib");
  } catch (_error) {
    e = _error;
  }

  /*istanbul ignore next */
  try {
    less = require("less");
  } catch (_error) {
    e = _error;
  }
  compilers = {
    css: {
      render: function(filename, code, cb, options) {
        cb(null, code);
      }
    },
    js: {
      render: function(filename, code, cb, options) {
        cb(null, code);
      }
    },
    coffee: {
      render: function(filename, code, cb, options) {
        try {
          return cb(null, coffeescript.compile(code));
        } catch (_error) {
          e = _error;
          return cb(e, null);
        }
      },
      targetExt: "js"
    }
  };

  /*istanbul ignore else */
  if (stylus != null) {

    /*istanbul ignore next */
    compilers.styl = {
      targetExt: "css",
      render: function(filename, code, cb, options) {
        return stylus(code).set('filename', filename).render(cb);
      }
    };

    /*istanbul ignore else */
    if (nib != null) {
      compilers.styl.render = function(filename, code, cb, options) {
        return stylus(code).set('filename', filename).use(nib()).render(cb);
      };
    }
  }

  /*istanbul ignore else */
  if (less != null) {
    compilers.less = {
      render: function(filename, code, cb, options) {
        return less.render(code, {
          paths: [classes.utils.path.dirname(filename)]
        }, cb);
      },
      targetExt: "css"
    };
  }
  debug('Available built-in compilers:', Object.keys(compilers).join(', '));
  out.compile = mainExports.compile = function(ext, filename, code, options, cb) {
    if (!ext || !compilers[ext]) {
      throw new Error("Compiler for '" + ext + "' not found");
    }
    debug("Compiling code for '" + ext + "'");
    return classes.utils.Q["try"](function() {
      return compilers[ext].render(filename, code, options);
    }).nodeify(cb);
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
    if (!classes.utils._.isFunction(renderFn)) {
      throw new Error('addCompiler function expects a function as second parameter');
    }
    def = factoryFn(classes);
    if (classes.utils._.isObject(def) && classes.utils._.isFunction(def.render)) {
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
