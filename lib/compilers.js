'use strict';
var Renderer, coffeescript, compilers, debug, e, less, nib, path, stylus;

coffeescript = require("coffee-script");

path = require("path");

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

compilers = {
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
  compilers.styl = {
    targetExt: "css",
    render: function(filename, code, cb) {
      return stylus(code).set('filename', filename).render(cb);
    }
  };

  /*istanbul ignore else */
  if (nib != null) {
    Renderer = require("stylus/lib/renderer");
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

module.exports = compilers;
