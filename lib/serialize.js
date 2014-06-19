'use strict';
var codeFrom, compilers, crypto, debug, executableFrom, extension, fs, getCompiler, path, pilers, removeTrailingComma, toGlobals, types;

crypto = require('crypto');

compilers = require('./compilers').compilers;

debug = require("debug")("piler:serialize");

path = require("path");

fs = require("graceful-fs");

extension = function(filename) {
  var parts;
  parts = filename.split(".");
  return parts[parts.length - 1];
};

executableFrom = function(fn, context) {
  if (!context) {
    return "(" + fn + ")();\n";
  }
  return "(" + fn + ").call(" + context + ");\n";
};

toGlobals = function(globals) {
  var code, nsString, v;
  code = "";
  for (nsString in globals) {
    v = globals[nsString];
    code += "__SET(" + (JSON.stringify(nsString)) + ", " + (codeFrom(v)) + ");\n";
  }
  return code;
};

getCompiler = function(filePath) {
  var compiler;
  compiler = compilers[extension(filePath)];
  if (!compiler) {
    throw new Error("Could not find compiler for " + filePath);
  }
  return compiler.render;
};

module.exports = (function() {
  var getId;
  getId = function() {
    var filename, hash, sum, _ref;
    sum = crypto.createHash('sha1');
    if (this.type === "file") {
      sum.update(this.filePath);
    } else {
      sum.update(codeFrom(this));
    }
    hash = sum.digest('hex').substring(10, 0);
    if ((_ref = this.type) === "file" || _ref === "module") {
      filename = path.basename(this.filePath);
      filename = filename.replace(/\./g, "_");
      filename = filename.replace(/\-/g, "_");
      hash = filename + "_" + hash;
    }
    return hash;
  };
  return function() {
    this.getId = getId;
    this.getCode = function(cb) {
      return pilers[this.type](this, cb);
    };
    return this;
  };
})();

module.exports.pilers = pilers = {
  raw: function(ob, cb) {
    cb(null, ob.raw);
  },
  object: function(ob, cb) {
    cb(null, toGlobals(ob.object));
  },
  exec: function(ob, cb) {
    cb(null, executableFrom(ob.object));
  },
  file: function(ob, cb) {
    fs.readFile(ob.filePath, function(err, data) {
      if (err) {
        return typeof cb === "function" ? cb(err) : void 0;
      }
      getCompiler(ob.filePath)(ob.filePath, data.toString(), function(err, code) {
        return cb(err, code);
      });
    });
  },
  module: function(ob, cb) {
    this.file(ob, function(err, code) {
      if (err) {
        return typeof cb === "function" ? cb(err) : void 0;
      }
      cb(null, "require.register(\"" + (path.basename(ob.filePath).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});");
    });
  }
};

module.exports.sha1 = function(code, out) {
  var sha1;
  sha1 = crypto.createHash('sha1');
  if (code) {
    sha1.update(code);
    if (out) {
      return sha1.digest(out);
    }
  }
  return sha1;
};

removeTrailingComma = function(s) {
  return s.trim().replace(/,$/, "");
};

types = {
  "function": function(fn) {
    return "" + fn;
  },
  string: function(s) {
    return JSON.stringify(s);
  },
  number: function(n) {
    return n.toString();
  },
  boolean: function(n) {
    return n.toString();
  },
  object: function(obj) {
    var code, k, v;
    if (Array.isArray(obj)) {
      return this._array(obj);
    }
    code = "{";
    for (k in obj) {
      v = obj[k];
      code += "\"" + k + "\": " + (codeFrom(v)) + ",";
    }
    return "" + (removeTrailingComma(code)) + " }";
  },
  _array: function(array) {
    var code, v, _i, _len;
    code = "[";
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      v = array[_i];
      code += " " + (codeFrom(v)) + ",";
    }
    return removeTrailingComma(code) + "]";
  }
};

module.exports.stringify = codeFrom = function(obj) {
  var _name;
  return typeof types[_name = typeof obj] === "function" ? types[_name](obj) : void 0;
};
