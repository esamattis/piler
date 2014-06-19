'use strict';
var addCompiler, coffeescript, compilers, debug, e, less, nib, path, stylus, _;

coffeescript = require("coffee-script");

path = require("path");

_ = require('lodash');

debug = require("debug")("piler:compilers");


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

module.exports.compilers = compilers = {
  css: {
    render: function(filename, code, cb) {
      cb(null, code);
    }
  },
  js: {
    render: function(filename, code, cb) {
      cb(null, code);
    }
  },
  coffee: {
    render: function(filename, code, cb) {
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
    render: function(filename, code, cb) {
      return stylus(code).set('filename', filename).render(cb);
    }
  };

  /*istanbul ignore else */
  if (nib != null) {
    compilers.styl.render = function(filename, code, cb) {
      return stylus(code).set('filename', filename).use(nib()).render(cb);
    };
  }
}


/*istanbul ignore else */

if (less != null) {
  compilers.less = {
    render: function(filename, code, cb) {
      return less.render(code, {
        paths: [path.dirname(filename)]
      }, cb);
    },
    targetExt: "css"
  };
}

debug('Available built-in compilers:', Object.keys(compilers).join(', '));


/**
 * Add a compiler to Piler. You can override existing extensions like css or js
 *
 * @example
 *   piler.addCompiler(function(){
 *     return {
 *       render: function(filename, code, cb){
 *         //do your compilation, then pass it to the callback
 *         cb(null, code);
 *       },
 *       targetExt: 'js'
 *     };
 *   });
 *
 * @function Piler.addCompiler
 *
 * @throws Error
 * @param {String} extension The extension that you want compiling
 * @param {Function} renderFn The function that will be factory for generating code
 */

module.exports.addCompiler = addCompiler = function(extension, renderFn) {
  var def;
  if (!_.isFunction(renderFn)) {
    throw new Error('addCompiler function expects a function as second parameter');
  }
  def = renderFn();
  if (_.isObject(def) && _.isFunction(def.render)) {
    compilers[extension] = def;
  } else {
    throw new Error('Your function must return an object containing "render" and optionally "targetExt"');
  }
};


/**
 * @function Piler.removeCompiler
 * @param {String} extension Extension to remove the compiler
 */

module.exports.removeCompiler = function(extension) {

  /*istanbul ignore else */
  if (compilers[extension]) {
    delete compilers[extension];
  }
};
