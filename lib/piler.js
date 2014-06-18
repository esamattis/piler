'use strict';

/**
 * @namespace Piler
 */
var BasePile, CSSManager, CSSPile, JSManager, JSPile, LiveUpdateMixin, OB, PileManager, addCompiler, addMinifier, asCodeOb, assetUrlParse, async, bindFn, cache, compilers, crypto, debug, defNs, executableFrom, extension, fs, getCompiler, logger, minifiers, path, pilers, production, reserved, toGlobals, _, _compilers, _minify,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

cache = require('./cache');

fs = require("graceful-fs");

path = require("path");

crypto = require('crypto');

path = require("path");

debug = require("debug")("piler:piler");

reserved = require('reserved');

_ = require("underscore");

async = require("async");

OB = require("./serialize");

_minify = require("./minify");

_compilers = require("./compilers");

assetUrlParse = require("./asseturlparse");

logger = require("./logger");

minifiers = {};

compilers = {};

toGlobals = function(globals) {
  var code, nsString, v;
  code = "";
  for (nsString in globals) {
    v = globals[nsString];
    code += "__SET(" + (JSON.stringify(nsString)) + ", " + (OB.stringify(v)) + ");\n";
  }
  return code;
};

extension = function(filename) {
  var parts;
  parts = filename.split(".");
  return parts[parts.length - 1];
};

getCompiler = function(filePath) {
  var compiler;
  compiler = compilers[extension(filePath)];
  if (!compiler) {
    throw new Error("Could not find compiler for " + filePath);
  }
  return compiler.render;
};

bindFn = function(_this, name) {
  return function(fn, before) {
    debug("res " + name, fn);
    _this[name]("temp", fn, before);
  };
};


/**
 * A code object
 *
 * @typedef {Object} Piler.codeOb
 * @property {Function} getId Get the code id
 * @property {Function(cb:Function)} getCode Get the code itself
 */

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

asCodeOb = (function() {
  var getId;
  getId = function() {
    var filename, hash, sum, _ref;
    sum = crypto.createHash('sha1');
    if (this.type === "file") {
      sum.update(this.filePath);
    } else {
      sum.update(OB.stringify(this));
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

BasePile = (function() {

  /**
   * @member {String} urlRoot
   * @instance
   * @memberof Piler.BasePile
   */
  BasePile.prototype.urlRoot = "/piler/";


  /**
   * @member {Boolean} production
   * @instance
   * @memberof Piler.BasePile
   */

  BasePile.prototype.production = false;


  /**
   * @constructor Piler.BasePile
   */

  function BasePile(name, production, urlRoot, options) {
    var _base, _base1;
    this.name = name;
    this.production = production;
    this.options = options != null ? options : {};
    if (urlRoot != null) {
      this.urlRoot = urlRoot;
    }
    this.code = [];
    this.rawPile = null;
    this.urls = [];
    this.piledUp = false;
    if ((_base = this.options).cacheKeys == null) {
      _base.cacheKeys = true;
    }
    if ((_base1 = this.options).volatile == null) {
      _base1.volatile = false;
    }
  }


  /**
   * Add an array of files at once
   *
   * @example
   *   Pile.addFile("/path/to/file")
   *
   * @memberof Piler.BasePile
   * @function addFile
   * @instance
   * @param {String} filePath Absolute path to the file
   * @param {Boolean} [before=false] Prepend this file instead of adding to the end of the pile
   *
   * @returns {Piler.BasePile} `this`
   */

  BasePile.prototype.addFile = function(filePath, before) {
    if (before == null) {
      before = false;
    }
    filePath = path.normalize(filePath);
    this.warnPiledUp("addFile");
    if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
      this.code[!before ? 'push' : 'unshift'](asCodeOb.call({
        type: "file",
        filePath: filePath
      }));
    }
    return this;
  };

  BasePile.prototype.reset = function() {
    if (this.options.volatile) {
      this.code.length = 0;
      this.urls.length = 0;
      this.rawPile = null;
    }
    return this;
  };


  /**
   * @memberof Piler.BasePile
   * @function addRaw
   * @param {*} raw
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.BasePile} `this`
   */

  BasePile.prototype.addRaw = function(raw, before) {
    if (before == null) {
      before = false;
    }
    this.warnPiledUp("addRaw");
    this.code[!before ? 'push' : 'unshift'](asCodeOb.call({
      type: "raw",
      raw: raw
    }));
    return this;
  };


  /**
   * @memberof Piler.BasePile
   * @function getFilePaths
   * @instance
   * @returns {Array.<String>} Array of file paths
   */

  BasePile.prototype.getFilePaths = function() {
    var ob, _i, _len, _ref, _results;
    _ref = this.code;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ob = _ref[_i];
      if (ob.type === "file") {
        _results.push(ob.filePath);
      }
    }
    return _results;
  };


  /**
   * @memberof Piler.BasePile
   * @function addUrl
   * @param {String} url
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.BasePile} `this`
   */

  BasePile.prototype.addUrl = function(url, before) {
    if (before == null) {
      before = false;
    }
    if (__indexOf.call(this.urls, url) < 0) {
      this.urls[!before ? 'push' : 'unshift'](url);
    }
    return this;
  };


  /**
   * @memberof Piler.BasePile
   * @function getSources
   * @instance
   * @returns {Array.<String>} Array of sources
   */

  BasePile.prototype.getSources = function() {
    var devCacheKey, ob, sources, u, _i, _len, _ref;
    sources = (function() {
      var _i, _len, _ref, _results;
      _ref = this.urls;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        u = _ref[_i];
        _results.push([u]);
      }
      return _results;
    }).call(this);
    if (this.production) {
      sources.push(["" + this.urlRoot + "min/" + this.pileHash + "/" + this.name + "." + this.ext]);
    } else {
      devCacheKey = '';
      if (this.options.cacheKeys) {
        devCacheKey = "?v=" + (Date.now());
      }
      _ref = this.code;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ob = _ref[_i];
        sources.push(["" + this.urlRoot + "dev/" + this.name + "." + ob.type + "-" + (ob.getId()) + "." + this.ext + devCacheKey, "id=\"pile-" + (ob.getId()) + "\""]);
      }
    }
    return sources;
  };


  /**
   * @memberof Piler.BasePile
   * @function findCodeObById
   * @param {String} id
   * @instance
   * @returns {Piler.codeOb}
   */

  BasePile.prototype.findCodeObById = function(id) {
    var codeOb;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.code;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        codeOb = _ref[_i];
        if (codeOb.getId() === id) {
          _results.push(codeOb);
        }
      }
      return _results;
    }).call(this))[0];
  };


  /**
   * @memberof Piler.BasePile
   * @function findCodeObByFilePath
   * @param {String} path
   * @instance
   * @returns {Piler.codeOb}
   */

  BasePile.prototype.findCodeObByFilePath = function(path) {
    var codeOb;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.code;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        codeOb = _ref[_i];
        if (codeOb.filePath === path) {
          _results.push(codeOb);
        }
      }
      return _results;
    }).call(this))[0];
  };


  /**
   * @memberof Piler.BasePile
   * @function _computeHash
   * @instance
   * @private
   *
   * @returns {String}
   */

  BasePile.prototype._computeHash = function() {
    var sum;
    sum = crypto.createHash('sha1');
    sum.update(this.rawPile);
    return this.pileHash = sum.digest('hex');
  };


  /**
   * @memberof Piler.BasePile
   * @function warnPiledUp
   * @instance
   * @protected
   */

  BasePile.prototype.warnPiledUp = function(fnname) {
    if (this.logger && this.piledUp && this.options.volatile !== true) {
      this.logger.warn("Warning pile " + this.name + " has been already piled up. Calling " + fnname + " does not do anything.");
    }
  };


  /**
   * @memberof Piler.BasePile
   * @function pileUp
   * @param {Function} [cb]
   * @instance
   * @returns {Piler.BasePile} `this`
   */

  BasePile.prototype.pileUp = function(cb) {
    if (this.options.volatile !== true) {
      this.piledUp = true;
    }
    async.map(this.code, (function(_this) {
      return function(codeOb, cb) {
        codeOb.getCode(function(err, code) {
          if (err) {
            return typeof cb === "function" ? cb(err) : void 0;
          }
          cb(null, _this.commentLine("" + codeOb.type + ": " + (codeOb.getId())) + ("\n" + code));
        });
      };
    })(this), (function(_this) {
      return function(err, result) {
        if (err) {
          return typeof cb === "function" ? cb(err) : void 0;
        }
        _this.rawPile = _this.minify(result.join("\n\n").trim());
        _this._computeHash();
        if (typeof cb === "function") {
          cb(null, _this.rawPile);
        }
      };
    })(this));
    return this;
  };

  return BasePile;

})();

JSPile = (function(_super) {
  __extends(JSPile, _super);


  /**
   * @member {String} ext
   * @memberof Piler.JSPile
   * @instance
   */

  JSPile.prototype.ext = "js";


  /**
   * Add line comment
   *
   * @function commentLine
   * @memberof Piler.JSPile
   * @returns {String}
   * @instance
   */

  JSPile.prototype.commentLine = function(line) {
    return "// " + (line.trim());
  };


  /**
   * Minify any valid Javascript code
   *
   * @memberof Piler.JSPile
   * @returns {String}
   * @instance
   */

  JSPile.prototype.minify = function(code) {
    if (this.production) {
      return minifiers.js(code, {
        noCache: this.options.volatile
      });
    } else {
      return code;
    }
  };


  /**
   * @augments Piler.BasePile
   * @constructor Piler.JSPile
   */

  function JSPile() {
    JSPile.__super__.constructor.apply(this, arguments);
  }


  /**
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @function addModule
   * @param {String} filePath
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.JSPile} `this`
   */

  JSPile.prototype.addModule = function(filePath, before) {
    if (before == null) {
      before = false;
    }
    filePath = path.normalize(filePath);
    this.warnPiledUp("addFile");
    if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
      this.code[!before ? 'push' : 'unshift'](asCodeOb.call({
        type: "module",
        filePath: filePath
      }));
    }
    return this;
  };


  /**
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @param {Object} ob
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.JSPile} `this`
   */

  JSPile.prototype.addOb = function(ob, before) {
    if (before == null) {
      before = false;
    }
    this.warnPiledUp("addOb");
    this.code[!before ? 'push' : 'unshift'](asCodeOb.call({
      type: "object",
      object: ob
    }));
    return this;
  };


  /**
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @param {Function} fn
   * @param {Boolean} [before=false]
   * @instance
   * @function addExec
   * @returns {Piler.JSPile} `this`
   */

  JSPile.prototype.addExec = function(fn, before) {
    if (before == null) {
      before = false;
    }
    this.warnPiledUp("addExec");
    this.code[!before ? 'push' : 'unshift'](asCodeOb.call({
      type: "exec",
      object: fn
    }));
    return this;
  };

  return JSPile;

})(BasePile);

CSSPile = (function(_super) {
  __extends(CSSPile, _super);


  /**
   * @member {String} ext
   * @memberof Piler.CSSPile
   * @instance
   */

  CSSPile.prototype.ext = "css";


  /**
   * @constructor Piler.CSSPile
   * @augments Piler.BasePile
   */

  function CSSPile() {
    CSSPile.__super__.constructor.apply(this, arguments);
  }


  /**
   * Add a line comment to CSS
   *
   * @memberof Piler.CSSPile
   * @param {String} line
   * @instance
   * @function commentLine
   * @returns {Piler.CSSPile} `this`
   */

  CSSPile.prototype.commentLine = function(line) {
    return "/* " + (line.trim()) + " */";
  };


  /**
   * Minify any CSS code
   *
   * @memberof Piler.CSSPile
   * @param {String} code
   * @instance
   * @function minify
   * @returns {Piler.CSSPile} `this`
   */

  CSSPile.prototype.minify = function(code) {
    if (this.production) {
      return minifiers.css(code, {
        noCache: this.options.volatile
      });
    } else {
      return code;
    }
  };

  return CSSPile;

})(BasePile);

defNs = function(fn) {
  return function(ns, path, before) {
    if (before == null) {
      before = false;
    }
    if (arguments.length === 1) {
      path = ns;
      ns = "global";
    }
    return fn.call(this, ns, path, before);
  };
};


/**
 * @typedef {Object} Piler.PileSettings
 * @property {Boolean} cacheKeys
 * @property {Boolean} volatile
 */

PileManager = (function() {

  /**
   * @memberof Piler.PileManager
   * @member {Piler.BasePile} Type
   * @instance
   */
  PileManager.prototype.Type = null;


  /**
   * @constructor Piler.PileManager
   */

  function PileManager(settings) {
    var _base;
    this.settings = settings;
    this.production = this.settings.production;
    if ((_base = this.settings).urlRoot == null) {
      _base.urlRoot = "/pile/";
    }
    this.logger = this.settings.logger || logger;
    this.piles = {};
    this.getPile("global");
    this.getPile("temp", {
      volatile: true
    });
    return;
  }


  /**
   * @memberof Piler.PileManager
   * @instance
   * @param {String} ns
   * @param {Piler.PileSettings} settings
   * @function getPile
   * @returns {Piler.BasePile} `this`
   */

  PileManager.prototype.getPile = function(ns, settings) {
    var pile;
    if (settings == null) {
      settings = {};
    }
    pile = this.piles[ns];
    if (!pile) {
      pile = this.piles[ns] = new this.Type(ns, this.production, this.settings.urlRoot, settings);
    }
    return pile;
  };


  /**
   * Add an array of files at once
   *
   * @example
   *   PileManager.addFiles("namespace", ["/file/1","/file/2"])
   *
   * @memberof Piler.PileManager
   *
   * @function addFiles
   * @param {String} ns
   * @param {Array} arr
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.addFiles = defNs(function(ns, arr, before) {
    var file, _i, _len;
    if (before == null) {
      before = false;
    }
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      file = arr[_i];
      this.addFile(ns, file, before);
    }
    return this;
  });


  /**
   * @memberof Piler.PileManager
   * @instance
   * @param {String} ns
   * @param {String} path
   * @param {Boolean} [before=false]
   * @function addFile
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.addFile = defNs(function(ns, path, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    pile = this.getPile(ns);
    pile.addFile(path, before);
    return this;
  });


  /**
   * @memberof Piler.PileManager
   * @function addRaw
   * @param {String} ns
   * @param {String} raw
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.addRaw = defNs(function(ns, raw, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    pile = this.getPile(ns);
    pile.addRaw(raw, before);
    return this;
  });


  /**
   * @memberof Piler.PileManager
   * @function addUrl
   * @param {String} ns
   * @param {String} url
   * @param {Boolean} [before=false]
   * @instance
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.addUrl = defNs(function(ns, url, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    pile = this.getPile(ns);
    pile.addUrl(url, before);
    return this;
  });


  /**
   * @memberof Piler.PileManager
   * @function pileUp
   * @instance
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.pileUp = function() {
    var name, pile, _fn, _ref;
    logger = this.logger;
    logger.notice("Start assets generation for '" + this.Type.prototype.ext + "'");
    _ref = this.piles;
    _fn = (function(_this) {
      return function(pile) {
        return pile.pileUp(function(err, code) {
          var outputPath;
          if (err) {
            throw err;
          }
          if (_this.settings.outputDirectory != null) {
            if (pile.options.volatile === true) {
              return;
            }
            outputPath = path.join(_this.settings.outputDirectory, "" + pile.name + "." + pile.ext);
            fs.writeFile(outputPath, code, function(err) {
              if (err) {
                throw err;
              }
              return logger.info("Wrote " + pile.ext + " pile " + pile.name + " to " + outputPath);
            });
          }
        });
      };
    })(this);
    for (name in _ref) {
      pile = _ref[name];
      _fn(pile);
    }
    return this;
  };


  /**
   * @memberof Piler.PileManager
   * @instance
   * @param {...*} [namespaces]
   * @returns {Array.<String>} Array of sources
   */

  PileManager.prototype.getSources = function() {
    var namespaces, ns, opts, pile, sources, _i, _len;
    namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (typeof _.last(namespaces) === "object") {
      opts = namespaces.pop();
    } else {
      opts = {};
    }
    if (!opts.disableGlobal) {
      namespaces.unshift("global");
    }
    if (!opts.disableTemp) {
      namespaces.push("temp");
    }
    sources = [];
    for (_i = 0, _len = namespaces.length; _i < _len; _i++) {
      ns = namespaces[_i];
      if (pile = this.piles[ns]) {
        sources.push.apply(sources, pile.getSources());
      }
    }
    return sources;
  };


  /**
   * @memberof Piler.PileManager
   * @param {...*} [namespaces]
   * @instance
   * @returns {String} Rendered tags
   */

  PileManager.prototype.renderTags = function() {
    var namespaces, src, tags, _i, _len, _ref;
    namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    tags = "";
    _ref = this.getSources.apply(this, namespaces);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      src = _ref[_i];
      tags += this.wrapInTag(src[0], src[1]);
      tags += "\n";
    }
    return tags;
  };


  /**
   * @memberof Piler.PileManager
   * @function bind
   * @param {Express} app Express application
   * @param {http.Server} server HTTP server
   * @instance
   * @returns {Piler.PileManager} `this`
   */

  PileManager.prototype.bind = function(app, server) {
    if (!server) {
      throw new Error('You must pass an existing server to bind function as second parameter');
    }
    this.app = app;
    this.server = server;
    server.on("listening", (function(_this) {
      return function() {
        _this.pileUp();
      };
    })(this));
    if (typeof this.setMiddleware === "function") {
      this.setMiddleware(app);
    }
    debug('setting asset serving');
    app.use((function(_this) {
      return function(req, res, next) {
        var asset, codeOb, pile;
        if (!_.startsWith(req.url, _this.settings.urlRoot)) {
          return next();
        }
        res.setHeader("Content-type", _this.contentType);
        asset = assetUrlParse(req.url);
        debug('request url', req.url, 'asset', asset);
        if (asset.ext !== _this.Type.prototype.ext) {
          return next();
        }
        pile = _this.piles[asset.name];
        if (!pile) {
          debug('pile not found', asset.name);
          res.send("Cannot find pile " + asset.name, 404);
          return;
        }
        if (asset.min) {
          if (pile.options.volatile === true) {
            debug('prod code volatile object', asset.name, asset.ext);
            pile.pileUp(function(err, code) {
              if (err) {
                throw err;
              }
              res.send(code);
              pile.reset();
              res.end();
            });
          } else {
            res.set({
              'Cache-Control': 'max-age=31556900'
            });
            res.send(pile.rawPile);
            res.end();
          }
          return;
        }
        codeOb = pile.findCodeObById(asset.dev.uid);
        if (codeOb) {
          debug('dev code object', codeOb);
          codeOb.getCode(function(err, code) {
            if (err) {
              throw err;
            }
            res.end(code);
          });
        } else {
          res.send("Cannot find codeOb " + asset.dev.uid, 404);
        }
        if (pile.options.volatile === true) {
          pile.reset();
        }
      };
    })(this));
    return this;
  };

  return PileManager;

})();

JSManager = (function(_super) {
  __extends(JSManager, _super);

  JSManager.prototype.Type = JSPile;

  JSManager.prototype.contentType = "application/javascript";


  /**
   * @constructor Piler.JSManager
   * @augments Piler.PileManager
   */

  function JSManager() {
    JSManager.__super__.constructor.apply(this, arguments);
    this.piles.global.addExec(function() {
      window._NS = function(nsString) {
        var ns, parent, _i, _len, _ref;
        parent = window;
        _ref = nsString.split(".");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ns = _ref[_i];
          parent = parent[ns] != null ? parent[ns] : parent[ns] = {};
        }
        return parent;
      };
      return window.__SET = function(ns, ob) {
        var nsOb, parts, target;
        parts = ns.split(".");
        if (parts.length === 1) {
          return window[parts[0]] = ob;
        } else {
          nsOb = _NS(parts.slice(0, -1).join("."));
          target = parts.slice(-1)[0];
          return nsOb[target] = ob;
        }
      };
    });
    return;
  }


  /**
   * @memberof Piler.JSManager
   * @instance
   * @function wrapInTag
   * @returns {String}
   */

  JSManager.prototype.wrapInTag = function(uri, extra) {
    if (extra == null) {
      extra = "";
    }
    return "<script type=\"text/javascript\"  src=\"" + uri + "\" " + extra + " ></script>";
  };


  /**
   * @memberof Piler.JSManager
   * @instance
   * @private
   * @param {String} ns
   * @function _isReserved
   * @throws Error
   */

  JSManager.prototype._isReserved = function(ns) {
    if (reserved.indexOf(ns) !== -1) {
      throw new Error("" + ns + " is a reserved word and can't be used");
    }
  };


  /**
   * @memberof Piler.JSManager
   * @instance
   * @param {String} ns
   * @param {String} path
   * @param {Boolean} [before=false]
   * @function addModule
   * @returns {Piler.JSManager} `this`
   */

  JSManager.prototype.addModule = defNs(function(ns, path, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    this._isReserved(ns);
    pile = this.getPile(ns);
    pile.addModule(path, before);
    return this;
  });


  /**
   * @memberof Piler.JSManager
   * @instance
   * @param {String} ns
   * @param {String} ob
   * @param {Boolean} [before=false]
   * @function addOb
   * @returns {Piler.JSManager} `this`
   */

  JSManager.prototype.addOb = defNs(function(ns, ob, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    this._isReserved(ns);
    pile = this.getPile(ns);
    pile.addOb(ob, before);
    return this;
  });


  /**
   * @memberof Piler.JSManager
   * @instance
   * @function addExec
   * @param {String} ns
   * @param {String} fn
   * @param {Boolean} [before=false]
   * @returns {Piler.JSManager} `this`
   */

  JSManager.prototype.addExec = defNs(function(ns, fn, before) {
    var pile;
    if (before == null) {
      before = false;
    }
    this._isReserved(ns);
    pile = this.getPile(ns);
    pile.addExec(fn, before);
    return this;
  });


  /**
   * @memberof Piler.JSManager
   * @instance
   * @function setMiddleware
   * @returns {Piler.JSManager} `this`
   */

  JSManager.prototype.setMiddleware = function(app) {
    var _this;
    debug('setting JSManager middleware');
    _this = this;
    app.use(function(req, res, next) {
      var _base;
      if (res.piler == null) {
        res.piler = {};
      }
      if ((_base = res.piler).js == null) {
        _base.js = {};
      }
      res.piler.js = {
        addExec: bindFn(_this, 'addExec'),
        addRaw: bindFn(_this, 'addRaw'),
        addOb: bindFn(_this, 'addOb'),
        addModule: bindFn(_this, 'addModule'),
        addFile: bindFn(_this, 'addFile'),
        addUrl: bindFn(_this, 'addUrl')
      };
      next();
    });
    return this;
  };

  return JSManager;

})(PileManager);

CSSManager = (function(_super) {
  __extends(CSSManager, _super);


  /**
   * @member {CSSPile} Type
   * @memberof Piler.CSSManager
   * @instance
   */

  CSSManager.prototype.Type = CSSPile;


  /**
   * @member {String} contentType
   * @memberof Piler.CSSManager
   * @instance
   */

  CSSManager.prototype.contentType = "text/css";


  /**
   * @constructor Piler.CSSManager
   * @augments Piler.PileManager
   */

  function CSSManager() {
    CSSManager.__super__.constructor.apply(this, arguments);
  }


  /**
   * Wrap a stylesheet path in a link tag
   *
   * @memberof Piler.CSSManager
   * @function wrapInTag
   * @instance
   * @returns {String}
   */

  CSSManager.prototype.wrapInTag = function(uri, extra) {
    if (extra == null) {
      extra = "";
    }
    return "<link rel=\"stylesheet\" href=\"" + uri + "\" " + extra + " />";
  };


  /**
   * @memberof Piler.CSSManager
   * @function setMiddleware
   * @instance
   */

  CSSManager.prototype.setMiddleware = function(app) {
    var _this;
    debug('setting CSSManager middleware');
    _this = this;
    app.use(function(req, res, next) {
      var _base;
      if (res.piler == null) {
        res.piler = {};
      }
      if ((_base = res.piler).css == null) {
        _base.css = {};
      }
      res.piler.css.addRaw = bindFn(_this, 'addRaw');
      res.piler.css.addFile = bindFn(_this, 'addFile');
      res.piler.css.addUrl = bindFn(_this, 'addUrl');
      next();
    });
  };

  return CSSManager;

})(PileManager);

executableFrom = function(fn, context) {
  if (!context) {
    return "(" + fn + ")();\n";
  }
  return "(" + fn + ").call(" + context + ");\n";
};

LiveUpdateMixin = require("./livecss");

_.extend(JSManager.prototype, LiveUpdateMixin.prototype);

exports.production = production = process.env.NODE_ENV === "production";

exports.BasePile = BasePile;

exports.CSSPile = CSSPile;

exports.JSPile = JSPile;

exports.JSManager = JSManager;

exports.CSSManager = CSSManager;


/**
 * Create a new JS Manager for adding Javascript files
 *
 * @param {Object} [settings] Settings to pass to JSManager
 *
 * @function Piler.createJSManager
 * @returns {Piler.JSManager}
 */

exports.createJSManager = function(settings) {
  if (settings == null) {
    settings = {};
  }
  settings.production = production;
  return new JSManager(settings);
};


/**
 * Create a new CSS Manager for adding stylesheet files
 *
 * @function Piler.createCSSManager
 *
 * @param {Object} [settings] Settings to pass to CSSManager
 * @returns {Piler.CSSManager}
 */

exports.createCSSManager = function(settings) {
  if (settings == null) {
    settings = {};
  }
  settings.production = production;
  return new CSSManager(settings);
};


/**
 * @typedef {Function} Piler.minifyFactory
 * @returns {{render:Function}}
 */


/**
 * Add your own minifier
 *
 * @function Piler.addMinifier
 * @param {String} ext Extension
 * @param {Piler.minifyFactory} factory Function that returns a function
 * @returns factory
 */

exports.addMinifier = addMinifier = function(ext, factory) {
  return minifiers[ext] = factory();
};

addMinifier('js', function() {
  return _minify.js;
});

addMinifier('css', function() {
  return _minify.css;
});


/**
 * Remove a minifier
 *
 * @function Piler.removeMinifier
 * @param {String} ext Extension
 */

exports.removeMinifier = function(ext) {
  if (minifiers[ext]) {
    delete minifiers[ext];
  }
};


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

exports.addCompiler = addCompiler = function(extension, renderFn) {
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

(function() {
  var c, def;
  for (c in _compilers) {
    def = _compilers[c];
    addCompiler(c, (function(def) {
      return function() {
        return def;
      };
    })(def));
  }
})();


/**
 * @function Piler.removeCompiler
 * @param {String} extension Extension to remove the compiler
 */

exports.removeCompiler = function(extension) {
  if (compilers[extension]) {
    delete compilers[extension];
  }
};


/**
 * @typedef {Function} Piler.cacheFn
 * @param {String} code The raw code itself
 * @param {String} hash The current sha1 of the code
 * @param {Function} code Execute the minify routine that generates code
 * @returns {String}
 */


/**
 * Add the cache method. By default it uses the filesystem. When you assign a function by yourself, it will override the internal one.
 *
 * @example
 *   piler.useCache(function(code, hash, fnCompress) {
 *     if (typeof memoryCache[hash] === 'undefined') {
 *       memoryCache[hash] = fnCompress();
 *     }
 *     return memoryCache[hash];
 *   });
 *
 * @param {Piler.cacheFn} cacheFn Function that will be called with the current code, generated hash and the callback
 * @throws Error
 *
 * @function Piler.useCache
 */

exports.useCache = function(cacheFn) {
  if (!_.isFunction(cacheFn)) {
    throw new Error('useCache expects a function');
  }
  if (cacheFn.length < 3) {
    throw new Error('useCache expects a function with 3 arguments defined');
  }
  cache.options.useFS = false;
  cache.options.cacheCallback = cacheFn;
};
