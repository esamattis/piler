var BasePile, CSSManager, CSSPile, JSManager, JSPile, LiveUpdateMixin, OB, PileManager, asCodeOb, assetUrlParse, async, compilers, crypto, cssMinify, defNs, executableFrom, extension, fs, getCompiler, jsMinify, logger, path, production, toGlobals, wrapInScriptTagInline, _, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

fs = require("fs");

path = require("path");

crypto = require('crypto');

path = require("path");

_ = require("underscore");

async = require("async");

_ref = require("./minify"), jsMinify = _ref.jsMinify, cssMinify = _ref.cssMinify;

OB = require("./serialize");

compilers = require("./compilers");

assetUrlParse = require("./asseturlparse");

logger = require("./logger");

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

wrapInScriptTagInline = function(code) {
  return "<script type=\"text/javascript\" >\n" + code + "\n</script>\n";
};

getCompiler = function(filePath) {
  var compiler;
  compiler = compilers[extension(filePath)];
  if (!compiler) {
    throw new Error("Could not find compiler for " + filePath);
  }
  return compiler.render;
};

asCodeOb = (function() {
  var getId, pilers;
  getId = function() {
    var filename, hash, sum, _ref1;
    sum = crypto.createHash('sha1');
    if (this.type === "file") {
      sum.update(this.filePath);
    } else {
      sum.update(OB.stringify(this));
    }
    hash = sum.digest('hex').substring(10, 0);
    if ((_ref1 = this.type) === "file" || _ref1 === "module") {
      filename = path.basename(this.filePath);
      filename = filename.replace(/\./g, "_");
      filename = filename.replace(/\-/g, "_");
      hash = filename + "_" + hash;
    }
    return hash;
  };
  pilers = {
    raw: function(ob, cb) {
      return cb(null, ob.raw);
    },
    object: function(ob, cb) {
      return cb(null, toGlobals(ob.object));
    },
    exec: function(ob, cb) {
      return cb(null, executableFrom(ob.object));
    },
    file: function(ob, cb) {
      var _this = this;
      return fs.readFile(ob.filePath, function(err, data) {
        if (err) {
          return typeof cb === "function" ? cb(err) : void 0;
        }
        return getCompiler(ob.filePath)(ob.filePath, data.toString(), function(err, code) {
          return cb(err, code);
        });
      });
    },
    module: function(ob, cb) {
      return this.file(ob, function(err, code) {
        if (err) {
          return typeof cb === "function" ? cb(err) : void 0;
        }
        return cb(null, "require.register(\"" + (path.basename(ob.filePath).split(".")[0]) + "\", function(module, exports, require) {\n" + code + "\n});");
      });
    }
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

  BasePile.prototype.urlRoot = "/piler/";

  BasePile.prototype.production = false;

  function BasePile(name, production, urlRoot) {
    this.name = name;
    this.production = production;
    if (urlRoot != null) {
      this.urlRoot = urlRoot;
    }
    this.code = [];
    this.rawPile = null;
    this.urls = [];
    this.devMapping = {};
    this.piledUp = false;
  }

  BasePile.prototype.addFile = function(filePath) {
    filePath = path.normalize(filePath);
    this.warnPiledUp("addFile");
    if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
      return this.code.push(asCodeOb.call({
        type: "file",
        filePath: filePath
      }));
    }
  };

  BasePile.prototype.addRaw = function(raw) {
    this.warnPiledUp("addRaw");
    return this.code.push(asCodeOb.call({
      type: "raw",
      raw: raw
    }));
  };

  BasePile.prototype.getFilePaths = function() {
    var ob, _i, _len, _ref1, _results;
    _ref1 = this.code;
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      ob = _ref1[_i];
      if (ob.type === "file") {
        _results.push(ob.filePath);
      }
    }
    return _results;
  };

  BasePile.prototype.addUrl = function(url) {
    if (__indexOf.call(this.urls, url) < 0) {
      return this.urls.push(url);
    }
  };

  BasePile.prototype.getSources = function() {
    var devCacheKey, ob, sources, u, _i, _len, _ref1;
    devCacheKey = Date.now();
    sources = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.urls;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        u = _ref1[_i];
        _results.push([u]);
      }
      return _results;
    }).call(this);
    if (this.production) {
      sources.push(["" + this.urlRoot + "min/" + this.pileHash + "/" + this.name + "." + this.ext]);
    } else {
      _ref1 = this.code;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        ob = _ref1[_i];
        sources.push(["" + this.urlRoot + "dev/" + devCacheKey + "/" + this.name + "." + ob.type + "-" + (ob.getId()) + "." + this.ext, "id=\"pile-" + (ob.getId()) + "\""]);
      }
    }
    return sources;
  };

  BasePile.prototype.findCodeObById = function(id) {
    var codeOb;
    return ((function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.code;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        codeOb = _ref1[_i];
        if (codeOb.getId() === id) {
          _results.push(codeOb);
        }
      }
      return _results;
    }).call(this))[0];
  };

  BasePile.prototype.findCodeObByFilePath = function(path) {
    var codeOb;
    return ((function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.code;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        codeOb = _ref1[_i];
        if (codeOb.filePath === id) {
          _results.push(codeOb);
        }
      }
      return _results;
    }).call(this))[0];
  };

  BasePile.prototype._computeHash = function() {
    var sum;
    sum = crypto.createHash('sha1');
    sum.update(this.rawPile);
    return this.pileHash = sum.digest('hex');
  };

  BasePile.prototype.warnPiledUp = function(fnname) {
    if (this.piledUp) {
      return this.logger.warn("Warning pile " + this.name + " has been already piled up. Calling " + fnname + " does not do anything.");
    }
  };

  BasePile.prototype.pileUp = function(cb) {
    var _this = this;
    this.piledUp = true;
    return async.map(this.code, function(codeOb, cb) {
      return codeOb.getCode(function(err, code) {
        if (err) {
          return typeof cb === "function" ? cb(err) : void 0;
        }
        return cb(null, _this.commentLine("" + codeOb.type + ": " + (codeOb.getId())) + ("\n" + code));
      });
    }, function(err, result) {
      if (err) {
        return typeof cb === "function" ? cb(err) : void 0;
      }
      _this.rawPile = _this.minify(result.join("\n\n").trim());
      _this._computeHash();
      return typeof cb === "function" ? cb(null, _this.rawPile) : void 0;
    });
  };

  return BasePile;

})();

JSPile = (function(_super) {

  __extends(JSPile, _super);

  JSPile.prototype.ext = "js";

  JSPile.prototype.commentLine = function(line) {
    return "// " + (line.trim());
  };

  JSPile.prototype.minify = function(code) {
    if (this.production) {
      return jsMinify(code);
    } else {
      return code;
    }
  };

  function JSPile() {
    JSPile.__super__.constructor.apply(this, arguments);
    this.objects = [];
  }

  JSPile.prototype.addModule = function(filePath) {
    filePath = path.normalize(filePath);
    this.warnPiledUp("addFile");
    if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
      return this.code.push(asCodeOb.call({
        type: "module",
        filePath: filePath
      }));
    }
  };

  JSPile.prototype.addOb = function(ob) {
    this.warnPiledUp("addOb");
    return this.code.push(asCodeOb.call({
      type: "object",
      object: ob
    }));
  };

  JSPile.prototype.addExec = function(fn) {
    this.warnPiledUp("addExec");
    return this.code.push(asCodeOb.call({
      type: "exec",
      object: fn
    }));
  };

  return JSPile;

})(BasePile);

CSSPile = (function(_super) {

  __extends(CSSPile, _super);

  function CSSPile() {
    return CSSPile.__super__.constructor.apply(this, arguments);
  }

  CSSPile.prototype.ext = "css";

  CSSPile.prototype.commentLine = function(line) {
    return "/* " + (line.trim()) + " */";
  };

  CSSPile.prototype.minify = function(code) {
    if (this.production) {
      return cssMinify(code);
    } else {
      return code;
    }
  };

  return CSSPile;

})(BasePile);

defNs = function(fn) {
  return function(ns, path) {
    if (arguments.length === 1) {
      path = ns;
      ns = "global";
    }
    return fn.call(this, ns, path);
  };
};

PileManager = (function() {

  PileManager.prototype.Type = null;

  function PileManager(settings) {
    var _base, _ref1;
    this.settings = settings;
    this.production = this.settings.production;
    if ((_ref1 = (_base = this.settings).urlRoot) == null) {
      _base.urlRoot = "/pile/";
    }
    this.logger = this.settings.logger || logger;
    this.piles = {
      global: new this.Type("global", this.production, this.settings.urlRoot)
    };
  }

  PileManager.prototype.getPile = function(ns) {
    var pile;
    pile = this.piles[ns];
    if (!pile) {
      pile = this.piles[ns] = new this.Type(ns, this.production, this.settings.urlRoot);
    }
    return pile;
  };

  PileManager.prototype.addFile = defNs(function(ns, path) {
    var pile;
    pile = this.getPile(ns);
    return pile.addFile(path);
  });

  PileManager.prototype.addRaw = defNs(function(ns, raw) {
    var pile;
    pile = this.getPile(ns);
    return pile.addRaw(raw);
  });

  PileManager.prototype.addUrl = defNs(function(ns, url) {
    var pile;
    pile = this.getPile(ns);
    return pile.addUrl(url);
  });

  PileManager.prototype.pileUp = function() {
    var name, pile, _ref1, _results,
      _this = this;
    logger = this.logger;
    logger.notice("Start assets generation for '" + this.Type.prototype.ext + "'");
    _ref1 = this.piles;
    _results = [];
    for (name in _ref1) {
      pile = _ref1[name];
      _results.push((function(pile) {
        return pile.pileUp(function(err, code) {
          var outputPath;
          if (err) {
            throw err;
          }
          if (_this.settings.outputDirectory != null) {
            outputPath = path.join(_this.settings.outputDirectory, "" + pile.name + "." + pile.ext);
            return fs.writeFile(outputPath, code, function(err) {
              if (err) {
                throw err;
              }
              return logger.info("Wrote " + pile.ext + " pile " + pile.name + " to " + outputPath);
            });
          }
        });
      })(pile));
    }
    return _results;
  };

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
    sources = [];
    for (_i = 0, _len = namespaces.length; _i < _len; _i++) {
      ns = namespaces[_i];
      if (pile = this.piles[ns]) {
        sources.push.apply(sources, pile.getSources());
      }
    }
    return sources;
  };

  PileManager.prototype.renderTags = function() {
    var namespaces, src, tags, _i, _len, _ref1;
    namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    tags = "";
    _ref1 = this.getSources.apply(this, namespaces);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      src = _ref1[_i];
      tags += this.wrapInTag(src[0], src[1]);
      tags += "\n";
    }
    return tags;
  };

  PileManager.prototype.bind = function(app, server) {
    var listener,
      _this = this;
    if (server == null) {
      server = null;
    }
    this.app = app;
    this.server = server;
    listener = server ? server : app;
    listener.on("listening", function() {
      return _this.pileUp();
    });
    this.setMiddleware(app);
    return app.use(function(req, res, next) {
      var asset, codeOb, pile;
      if (!_.startsWith(req.url, _this.settings.urlRoot)) {
        return next();
      }
      res.setHeader("Content-type", _this.contentType);
      asset = assetUrlParse(req.url);
      if (asset.ext !== _this.Type.prototype.ext) {
        return next();
      }
      pile = _this.piles[asset.name];
      if (!pile) {
        res.send("Cannot find pile " + asset.name, 404);
        return;
      }
      if (asset.min) {
        res.end(pile.rawPile);
        return;
      }
      codeOb = pile.findCodeObById(asset.dev.uid);
      return codeOb.getCode(function(err, code) {
        if (err) {
          throw err;
        }
        res.end(code);
      });
    });
  };

  return PileManager;

})();

JSManager = (function(_super) {

  __extends(JSManager, _super);

  JSManager.prototype.Type = JSPile;

  JSManager.prototype.contentType = "application/javascript";

  function JSManager() {
    JSManager.__super__.constructor.apply(this, arguments);
    this.piles.global.addExec(function() {
      window._NS = function(nsString) {
        var ns, parent, _i, _len, _ref1, _ref2;
        parent = window;
        _ref1 = nsString.split(".");
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          ns = _ref1[_i];
          parent = (_ref2 = parent[ns]) != null ? _ref2 : parent[ns] = {};
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
  }

  JSManager.prototype.wrapInTag = function(uri, extra) {
    if (extra == null) {
      extra = "";
    }
    return "<script type=\"text/javascript\"  src=\"" + uri + "\" " + extra + " ></script>";
  };

  JSManager.prototype.addModule = defNs(function(ns, path) {
    var pile;
    pile = this.getPile(ns);
    return pile.addModule(path);
  });

  JSManager.prototype.addOb = defNs(function(ns, ob) {
    var pile;
    pile = this.getPile(ns);
    return pile.addOb(ob);
  });

  JSManager.prototype.addExec = defNs(function(ns, fn) {
    var pile;
    pile = this.getPile(ns);
    return pile.addExec(fn);
  });

  JSManager.prototype.setMiddleware = function(app) {
    var responseExec, responseOb;
    responseExec = function(fn) {
      return this._responseFns.push(fn);
    };
    responseOb = function(ob) {
      return this._responseObs.push(ob);
    };
    return app.use(function(req, res, next) {
      var _ref1, _ref2;
      if ((_ref1 = res._responseFns) == null) {
        res._responseFns = [];
      }
      if ((_ref2 = res._responseObs) == null) {
        res._responseObs = [];
      }
      res.exec = res.addExec = responseExec;
      res.addOb = responseOb;
      return next();
    });
  };

  return JSManager;

})(PileManager);

CSSManager = (function(_super) {

  __extends(CSSManager, _super);

  function CSSManager() {
    return CSSManager.__super__.constructor.apply(this, arguments);
  }

  CSSManager.prototype.Type = CSSPile;

  CSSManager.prototype.contentType = "text/css";

  CSSManager.prototype.wrapInTag = function(uri, extra) {
    if (extra == null) {
      extra = "";
    }
    return "<link rel=\"stylesheet\" href=\"" + uri + "\" " + extra + " />";
  };

  CSSManager.prototype.setMiddleware = function(app) {};

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

exports.CSSPile = CSSPile;

exports.JSPile = JSPile;

exports.JSManager = JSManager;

exports.CSSManager = CSSManager;

exports.createJSManager = function(settings) {
  if (settings == null) {
    settings = {};
  }
  settings.production = production;
  return new JSManager(settings);
};

exports.createCSSManager = function(settings) {
  if (settings == null) {
    settings = {};
  }
  settings.production = production;
  return new CSSManager(settings);
};
