var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

module.exports = function(classes, mainExports) {
  'use strict';

  /**
   * @namespace Piler
   */
  var BasePile, CSSManager, CSSPile, JSManager, JSPile, PileManager, bindFn, debug, defNs, out, production;
  out = {
    debug: debug = classes.utils.debug("piler:piler")
  };
  bindFn = function(_this, name) {
    return function(fn, before) {
      debug("res " + name, fn);
      _this[name]("__temp", fn, before);
    };
  };
  BasePile = (function() {

    /**
     * @constructor Piler.BasePile
     */
    function BasePile(name, options) {
      var _base, _base1, _base2, _base3;
      this.name = name;
      this.options = options != null ? options : {};
      this.assets = [];
      this.rawPile = null;
      if ((_base = this.options).cacheKeys == null) {
        _base.cacheKeys = true;
      }
      if ((_base1 = this.options).volatile == null) {
        _base1.volatile = false;
      }
      if ((_base2 = this.options).urlRoot == null) {
        _base2.urlRoot = '/piler/';
      }
      if ((_base3 = this.options).production == null) {
        _base3.production = false;
      }
    }

    BasePile.prototype.add = function(config, before) {
      if (before == null) {
        before = false;
      }
      this.assets[!before ? 'push' : 'unshift'](classes.Serialize.serialize.call({
        type: config.type,
        adjustFilename: !!config.adjustFilename,
        object: config.object,
        fromUrl: !!config.fromUrl
      }));
      return this;
    };


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
      filePath = classes.utils.path.normalize(filePath);
      if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
        this.add({
          type: "file",
          adjustFilename: true,
          object: filePath,
          fromUrl: true
        }, before);
      }
      return this;
    };

    BasePile.prototype.reset = function() {
      if (this.options.volatile) {
        this.assets.length = 0;
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
      return this.add({
        type: "raw",
        object: raw
      }, before);
    };

    BasePile.prototype.getObjects = function(type) {
      var ob, _i, _len, _ref, _results;
      _ref = this.code;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ob = _ref[_i];
        if (ob.type === type) {
          _results.push(ob.object);
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
      if (__indexOf.call(this.getObjects('url'), url) < 0) {
        this.add({
          type: 'url',
          object: url
        }, before);
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
      if (this.options.production) {
        sources.push(["" + this.options.urlRoot + "min/" + this.pileHash + "/" + this.name + "." + this.ext]);
      } else {
        devCacheKey = '';
        if (this.options.cacheKeys) {
          devCacheKey = "?v=" + (Date.now());
        }
        _ref = this.assets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ob = _ref[_i];
          sources.push(["" + this.options.urlRoot + "dev/" + this.name + "." + ob.type + "-" + (ob.getId()) + "." + this.ext + devCacheKey, "id=\"pile-" + (ob.getId()) + "\""]);
        }
      }
      return sources;
    };

    BasePile.prototype.findAssetBy = function(member, search) {
      var codeOb;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = this.assets;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          codeOb = _ref[_i];
          if (codeOb[member]() === search) {
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
      return this.pileHash = classes.Serialize.sha1(this.rawPile, 'hex');
    };

    BasePile.prototype.minify = function(code, options) {
      if (options == null) {
        options = {};
      }
      if (!this.ext) {
        return code;
      }
      if (this.production) {
        return classes.Minify.minify(this.ext, code, classes.utils._.merge({
          noCache: this.options.volatile
        }, options));
      } else {
        return code;
      }
    };


    /**
     * @memberof Piler.BasePile
     * @function pileUp
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
     */

    BasePile.prototype.pileUp = function(cb) {
      var self;
      self = this;
      return classes.utils.Q.map(this.code, function(codeOb) {
        return codeOb.getCode().then(function(code) {
          return self.commentLine("" + codeOb.type + ": " + (codeOb.getId())) + ("\n" + code);
        });
      }).then(function(result) {
        self.rawPile = self.minify(result.join("\n\n").trim());
        self._computeHash();
        return self.rawPile;
      }, function(err) {
        return err;
      }).nodeify(cb);
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
      filePath = classes.utils.path.normalize(filePath);
      if (__indexOf.call(this.getFilePaths(), filePath) < 0) {
        this.add({
          type: "module",
          object: filePath
        }, before);
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
      this.code[!before ? 'push' : 'unshift'](classes.Serialize.codeObject.call({
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
      this.code[!before ? 'push' : 'unshift'](classes.Serialize.codeObject.call({
        type: "fn",
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

    return CSSPile;

  })(BasePile);
  defNs = function(fn) {
    return function(ns, obj, before) {
      if (before == null) {
        before = false;
      }
      if (arguments.length === 1) {
        obj = ns;
        ns = "global";
      }
      return fn.call(this, ns, obj, before);
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
     * @member {Piler.BasePile} type
     * @instance
     */
    PileManager.prototype.type = null;


    /**
     * @constructor Piler.PileManager
     */

    function PileManager(options) {
      var _base, _base1;
      this.options = options;
      if ((_base = this.options).urlRoot == null) {
        _base.urlRoot = "/pile/";
      }
      if ((_base1 = this.options).logger == null) {
        _base1.logger = classes.Logger;
      }
      this.piles = {};
      this.getPile("global");
      this.getPile("__temp", {
        volatile: true
      });
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
        pile = this.piles[ns] = new this.type(ns, settings);
      }
      return pile;
    };

    PileManager.prototype.add = defNs(function(ns, type, before) {
      var pile;
      pile = this.getPile(ns);
      return pile["add" + type]();
    });


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
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
     */

    PileManager.prototype.pileUp = function(cb) {
      var logger, options, piles;
      logger = this.logger;
      piles = this.piles;
      options = this.options;
      logger.notice("Start assets generation for '" + this.type.prototype.ext + "'");
      return classes.utils.Q.map(Object.keys(piles), function(name) {
        var pile;
        pile = piles[name];
        return pile.pileUp().then(function(code) {
          var outputPath;
          if (options.outputDirectory) {
            if (pile.options.volatile === true) {
              return code;
            }
            outputPath = classes.utils.path.join(options.outputDirectory, "" + pile.name + "." + pile.ext);
            return classes.utils.fs.writeFileAsync(outputPath, code).then(function() {
              logger.info("Wrote " + pile.ext + " pile " + pile.name + " to " + outputPath);
              return code;
            });
          } else {
            return code;
          }
        });
      }).nodeify(cb);
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
      if (typeof classes.utils._.last(namespaces) === "object") {
        opts = namespaces.pop();
      } else {
        opts = {};
      }
      if (!opts.disableGlobal) {
        namespaces.unshift("global");
      }
      if (!opts.disableTemp) {
        namespaces.push("__temp");
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
          if (!classes.utils._.startsWith(req.url, _this.settings.urlRoot)) {
            return next();
          }
          res.setHeader("Content-type", _this.contentType);
          asset = classes.AssetUrlParse.parse(req.url);
          debug('request url', req.url, 'asset', asset);
          if (asset.ext !== _this.type.prototype.ext) {
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

    JSManager.prototype.type = JSPile;

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
      if (classes.utils.reserved.indexOf(ns) !== -1) {
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

    CSSManager.prototype.type = CSSPile;


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
  classes.utils._.extend(JSManager.prototype, classes.LiveCSS.LiveUpdateMixin.prototype);
  out.production = production = process.env.NODE_ENV === "production";
  out.BasePile = mainExports.BasePile = BasePile;
  out.CSSPile = mainExports.CSSPile = CSSPile;
  out.JSPile = mainExports.JSPile = JSPile;
  out.JSManager = mainExports.JSManager = JSManager;
  out.CSSManager = mainExports.CSSManager = CSSManager;

  /**
   * Create a new JS Manager for adding Javascript files
   *
   * @param {Object} [settings] Settings to pass to JSManager
   *
   * @function Piler.createJSManager
   * @returns {Piler.JSManager}
   */
  out.createJSManager = mainExports.createJSManager = function(settings) {
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
  out.createCSSManager = mainExports.createCSSManager = function(settings) {
    if (settings == null) {
      settings = {};
    }
    settings.production = production;
    return new CSSManager(settings);
  };
  return out;
};
