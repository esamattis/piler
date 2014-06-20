var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

module.exports = function(classes, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Main
   */
  var BasePile, PileManager, bindFn, debug, defNs, out, production;
  out = {

    /**
     * Output debug messages as if it was from {@link Piler.Main}
     * @function Piler.Main.debug
     */
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
     * @constructor Pìler.Main.BasePile
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


    /**
     * @memberof Piler.Main.BasePile
     * @function add
     */

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
     * @memberof Piler.Main.BasePile
     * @function addFile
     * @instance
     * @param {String} filePath Absolute path to the file
     * @param {Boolean} [before=false] Prepend this file instead of adding to the end of the pile
     *
     * @returns {Piler.Main.BasePile} `this`
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
     * @memberof Piler.Main.BasePile
     * @function addRaw
     * @param {*} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.BasePile} `this`
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
     * @memberof Piler.Main.BasePile
     * @function addUrl
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.BasePile} `this`
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
     * @memberof Piler.Main.BasePile
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
      var obj;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = this.assets;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          if (obj[member]() === search) {
            _results.push(obj);
          }
        }
        return _results;
      }).call(this))[0];
    };


    /**
     * @memberof Piler.Main.BasePile
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
     * @memberof Piler.Main.BasePile
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
   * @typedef {Object} Piler.Main.PileSettings
   * @property {Boolean} cacheKeys
   * @property {Boolean} volatile
   * @property {String} urlRoot
   * @property {Object} logger
   */
  PileManager = (function() {

    /**
     * @memberof Piler.Main.PileManager
     * @member {Piler.Main.BasePile} type
     * @instance
     */
    PileManager.prototype.type = null;


    /**
     * @constructor Piler.Main.PileManager
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
     * @memberof Piler.Main.PileManager
     * @instance
     * @param {String} ns
     * @param {Piler.Main.PileSettings} settings
     * @function getPile
     * @returns {Piler.Main.BasePile} `this`
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
     * @memberof Piler.Main.PileManager
     *
     * @function addFiles
     * @param {String} ns
     * @param {Array} arr
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.PileManager} `this`
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
     * @memberof Piler.Main.PileManager
     * @instance
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @function addFile
     * @returns {Piler.Main.PileManager} `this`
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
     * @memberof Piler.Main.PileManager
     * @function addRaw
     * @param {String} ns
     * @param {String} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.PileManager} `this`
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
     * @memberof Piler.Main.PileManager
     * @function addUrl
     * @param {String} ns
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.PileManager} `this`
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
     * @memberof Piler.Main.PileManager
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
     * @memberof Piler.Main.PileManager
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
     * @memberof Piler.Main.PileManager
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
     * @memberof Piler.Main.PileManager
     * @function bind
     * @param {Express} app Express application
     * @param {http.Server} server HTTP server
     * @instance
     * @returns {Piler.Main.PileManager} `this`
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
  out.production = production = process.env.NODE_ENV === "production";
  out.BasePile = mainExports.BasePile = BasePile;
  return out.PileManager = mainExports.PileManager = PileManager;
};
