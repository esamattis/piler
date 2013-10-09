var Renderer, coffeescript, compilers, less, nib, path, stylus;

coffeescript = require("coffee-script");

path = require("path");

try {
  stylus = require("stylus");
} catch (e) {

}

try {
  nib = require("nib");
} catch (e) {

}

try {
  less = require("less");
} catch (e) {

}

compilers = {
  css: {
    render: function(filename, code, cb) {
      return cb(null, code);
    }
  },
  js: {
    render: function(filename, code, cb) {
      return cb(null, code);
    }
  },
  coffee: {
    render: function(filename, code, cb) {
      try {
        return cb(null, coffeescript.compile(code));
      } catch (e) {
        return cb(e, null);
      }
    },
    targetExt: "js"
  }
};

if (stylus != null) {
  compilers.styl = {
    targetExt: "css",
    render: function(filename, code, cb) {
      return stylus(code).set('filename', filename).render(cb);
    }
  };
  if (nib != null) {
    Renderer = require("stylus/lib/renderer");
    compilers.styl.render = function(filename, code, cb) {
      return stylus(code).set('filename', filename).use(nib()).render(cb);
    };
  }
}

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

module.exports = compilers;
