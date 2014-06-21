var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

module.exports = function(classes, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Main
   */
  var BasePile, PileManager, debug, managers, op, out, piles, production;
  op = classes.utils.objectPath;
  out = {

    /**
     * Output debug messages as if it was from {@link Piler.Main}
     * @function Piler.Main.debug
     */
    debug: debug = classes.utils.debug("piler:main")
  };

  /**
   * Config object for {@link Piler.Main.BasePile BasePile} and {@link Piler.Main.PileManager PileManager}
   * @typedef {Object} Piler.Main.Config
   */

  /**
   * Config object for {@link Piler.Main.BasePile#add BasePile#add}
   *
   * @typedef {Object} Piler.Main.AddConfig
   * @property {Boolean} type
   * @property {Boolean} object
   * @property {Boolean} options Assign any options to this object
   * @property {Boolean} options.before Prepend into the pile
   * @property {Boolean} options.asIs Wrap the tag using the {@link Piler.Serialize.CodeObject.object()} instead of the {@link Piler.Serialize.CodeObject.contents()}
   * @property {Boolean} options.filePath Assign that object is a filepath
   * @property {Boolean} options.noSumContent Don't create a hash from the contents, but from the {@link Piler.Serialize.CodeObject.object()} itself
   */
  BasePile = (function() {

    /**
     * @constructor Piler.Main.BasePile
     *
     * @param {String} name
     * @param {Piler.Main.Config} [options={}]
     */
    function BasePile(name, options) {
      this.name = name;
      this.options = options != null ? options : {};
      this.assets = [];
      this.rawPile = null;
      this.pileHash = '';
      classes.utils._.defaults(this.options, {
        cacheKeys: true,
        volatile: false,
        urlRoot: '/piler/',
        production: false
      });
      return;
    }


    /**
     * All add* calls ends here. Add an asset and mutate extend the passed
     * configuration with mixins from {@link Piler.Serialize.CodeObject}
     *
     * @function Piler.Main.BasePile#add
     * @param {Piler.Main.AddConfig} config
     * @returns {Promise}
     */

    BasePile.prototype.add = function(config) {
      var object, type;
      if (!classes.utils._.isObject(config)) {
        throw new Error('add expects an object as parameter');
      }
      op.ensureExists(config, 'options', {});
      config.options = classes.utils._.defaults(config.options, {
        filePath: false,
        asIs: false,
        noSumContent: false,
        before: false
      });
      type = !config.options.before ? 'push' : 'unshift';
      this.assets[type](object = classes.Serialize.serialize.call({
        type: config.type,
        object: config.object,
        options: config.options
      }));
      return classes.utils.Q.resolve(object);
    };


    /**
     * Adds a multiline that will be converted to a string later (or can be compiled to any code)
     *
     * @function Piler.Main.BasePile#addMultiline
     * @returns {Promise}
     */

    BasePile.prototype.addMultiline = function(fn, options) {
      if (options == null) {
        options = {};
      }
      return this.add({
        type: "multiline",
        object: fn,
        options: options
      });
    };


    /**
     * Add an array of files at once
     *
     * @example
     *   Pile.addFile("/path/to/file")
     *
     * @function Piler.Main.BasePile#addFile
     * @param {String} filePath Absolute path to the file
     * @param {Piler.Main.AddConfig} [options={}] Options to assign to this object
     *
     * @returns {Piler.Main.BasePile} `this`
     */

    BasePile.prototype.addFile = function(filePath, options) {
      if (options == null) {
        options = {};
      }
      filePath = classes.utils.path.normalize(filePath);
      return this.filterObjects('file').then((function(_this) {
        return function(files) {
          if (__indexOf.call(files, filePath) < 0) {
            options = classes.utils._.defaults(options, {
              noSumContent: true,
              filePath: true
            });
            return _this.add({
              type: "file",
              object: filePath,
              options: options
            });
          }
        };
      })(this));
    };


    /**
     * @function  Piler.Main.BasePile#addUrl
     * @param {String} url
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
     */

    BasePile.prototype.addUrl = function(url, options) {
      if (options == null) {
        options = {};
      }
      return this.filterObjects('url').then((function(_this) {
        return function(urls) {
          if (__indexOf.call(urls, url) < 0) {
            options = classes.utils._.defaults(options, {
              asIs: true
            });
            return _this.add({
              type: 'url',
              object: url,
              options: options
            });
          }
        };
      })(this));
    };


    /**
     * @function Piler.Main.BasePile#addRaw
     * @param {*} raw
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
     */

    BasePile.prototype.addRaw = function(raw, options) {
      if (options == null) {
        options = {};
      }
      return this.add({
        type: "raw",
        object: raw,
        options: options
      });
    };


    /**
     * @function Piler.Main.BasePile#filterObjects
     *
     * @returns {Promise} The result of the promise will be an array
     */

    BasePile.prototype.filterObjects = function(filter, member) {
      var ob;
      if (member == null) {
        member = 'object';
      }
      if (filter) {
        return classes.utils.Q.all((function() {
          var _i, _len, _ref, _results;
          _ref = this.assets;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ob = _ref[_i];
            if (ob.type() === filter) {
              _results.push(ob[member]());
            }
          }
          return _results;
        }).call(this));
      } else {
        return classes.utils.Q.all((function() {
          var _i, _len, _ref, _results;
          _ref = this.assets;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ob = _ref[_i];
            _results.push(ob[member]());
          }
          return _results;
        }).call(this));
      }
    };


    /**
     * Clear all the assets in this pile
     *
     * @function Piler.Main.BasePile#clear
     * @returns {Piler.Main.BasePile}
     */

    BasePile.prototype.clear = function() {
      this.assets.length = 0;
      this.rawPile = null;
      this.pileHash = '';
      return this;
    };


    /**
     * @function Piler.Main.BasePile#getSources
     * @returns {Promise} Return an array of strings
     */

    BasePile.prototype.getSources = function() {
      var devCacheKey, ob, sources, u, _i, _len, _ref;
      sources = (function() {
        var _i, _len, _ref, _results;
        _ref = this.assets;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          u = _ref[_i];
          if (u.options.asIs === true) {
            _results.push([u.object()]);
          }
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
          if (ob.options.asIs === false) {
            sources.push([
              "" + this.options.urlRoot + "dev/" + this.name + "." + (ob.type()) + "-" + (ob.id()) + "." + this.ext + devCacheKey, {
                id: "pile-" + (ob.id())
              }
            ]);
          }
        }
      }
      return sources;
    };


    /**
     * @function Piler.Main.BasePile#findAssetBy
     * @param {String} member
     * @param {*} search
     * @returns {Promise} Array of values or single value
     */

    BasePile.prototype.findAssetBy = function(member, search, one) {
      var asset, reduced;
      if (one == null) {
        one = true;
      }
      reduced = classes.utils.Q.reduce((function() {
        var _i, _len, _ref, _results;
        _ref = this.assets;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          asset = _ref[_i];
          _results.push(asset);
        }
        return _results;
      }).call(this), function(total, asset) {
        return classes.utils.Q["try"](function() {
          return asset[member]();
        }).then(function(value) {
          if (value === search) {
            return total.push(asset);
          }
        }).then(function() {
          return total;
        });
      }, []);
      if (one) {
        return reduced.then(function(values) {
          return values[0];
        });
      } else {
        return reduced;
      }
    };


    /**
     * @function Piler.Main.BasePile#_computeHash
     * @private
     *
     * @returns {String}
     */

    BasePile.prototype._computeHash = function() {
      return this.pileHash = classes.Serialize.sha1(this.rawPile, 'hex');
    };


    /**
     * Perform a compilation on the given object
     */

    BasePile.prototype.compile = function(code) {
      return classes.Compilers.compile(classes.utils.extension(ob.object()), ob.object(), code.toString());
    };

    BasePile.prototype.minify = function(code, options) {
      if (options == null) {
        options = {};
      }
      if (!this.ext) {
        return code;
      }
      if (this.options.production) {
        return classes.Minify.minify(this.ext, code, classes.utils._.merge({
          noCache: this.options.volatile
        }, options));
      } else {
        return code;
      }
    };


    /**
     * @function Piler.Main.BasePile#pileUp
     * @param {Function} [cb]
     * @returns {Promise}
     */

    BasePile.prototype.pileUp = function(cb) {
      var self;
      self = this;
      return classes.utils.Q.map(this.assets, function(codeOb) {
        debug('Piling up', codeOb);
        return codeOb.contents().then(function(code) {
          return self.commentLine("" + (codeOb.type()) + ": " + (codeOb.id())) + ("\n" + code);
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

  /**
   * @typedef {Object} Piler.Main.PileSettings
   * @property {Boolean} [cacheKeys=true]
   * @property {Boolean} [volatile=true]
   * @property {String} [urlRoot='/piler/']
   * @property {Object} [logger=console]
   */
  PileManager = (function() {

    /**
     * Binds an add function to an specific pile
     *
     * @function Piler.Main.PileManager#bindToPile
     * @param {String} fnName Any method name on the {@link Piler.Main.PileManager PileManager} class
     * @param {String} [namespace="__temp"] Namespace to be bound to
     * @returns {Function}
     */
    PileManager.prototype.bindToPile = function(fnName, namespace) {
      var self;
      if (namespace == null) {
        namespace = "__temp";
      }
      self = this;
      return function(data, options) {
        if (options == null) {
          options = {};
        }
        options = classes.utils._.defaults(options, {
          namespace: namespace
        });
        self[fnName](data, options);
      };
    };


    /**
     * @member {Piler.Main.BasePile} Piler.Main.PileManager#type
     * @default null
     */

    PileManager.prototype.type = null;


    /**
     * @member {String} Piler.Main.PileManager#contentType
     */

    PileManager.prototype.contentType = 'text/plain';


    /**
     * @constructor Piler.Main.PileManager
     * @param {Piler.Main.Config} [options={}]
     */

    function PileManager(name, options) {
      var _base, _base1;
      this.name = name;
      this.options = options != null ? options : {};
      if ((_base = this.options).urlRoot == null) {
        _base.urlRoot = '/piler/';
      }
      if ((_base1 = this.options).logger == null) {
        _base1.logger = classes.Logger;
      }
      this.piles = {};
      this.getPile("global");
      this.getPile("__temp", {
        volatile: true
      });
      return;
    }


    /**
     * Get a pile from this manager. If it doesn't exist, it will create one
     *
     * @function Piler.Main.PileManager#getPile
     * @param {String} ns
     * @param {Piler.Main.PileSettings} [settings={}]
     * @returns {Piler.Main.BasePile} `this`
     */

    PileManager.prototype.getPile = function(ns, settings) {
      var pile;
      if (settings == null) {
        settings = {};
      }
      pile = this.piles[ns];
      if (!pile) {
        return this.piles[ns] = new this.type(ns, settings);
      }
      return pile;
    };


    /**
     * @function Piler.Main.PileManager#_defaultArguments
     * @protected
     */

    PileManager.prototype._defaultArguments = function(options) {
      if (!options.namespace) {
        options.namespace = 'global';
      }
    };


    /**
     * Low level function that actually adds stuff to the pile, deals with
     * normalizing arguments
     * @function Piler.Main.PileManager#add
     * @param {String} type BasePile method name
     * @param {*} data Any type of data that should be piled
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.add = function(type, data, options) {
      var pile;
      if (options == null) {
        options = {};
      }
      this._defaultArguments(options);
      debug('Adding:', type, data, options);
      pile = this.getPile(options.namespace);
      return pile["" + type](data, options);
    };


    /**
     * Add an array of files at once
     *
     * @example
     *   PileManager.addFiles(["/file/1","/file/2"])
     *
     * @function Piler.Main.PileManager#addFiles
     *
     * @param {Array} arr
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addFiles = function(arr, options) {
      var file;
      arr = classes.utils.ensureArray([], arr);
      return classes.utils.Q.all((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          file = arr[_i];
          _results.push(this.addFile(file, options));
        }
        return _results;
      }).call(this));
    };


    /**
     * Add a directory
     *
     * @example
     *   PileManager.addDir(["/file/1","/file/2"])
     *
     * @function Piler.Main.PileManager#addDir
     *
     * @param {String|Array} paths You can give a glob string or an array of glob strings
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addDir = function(arr, options) {
      var file;
      arr = classes.utils.ensureArray(arr);
      return classes.utils.Q.all((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          file = arr[_i];
          _results.push(this.addFile(file, options));
        }
        return _results;
      }).call(this));
    };


    /**
     * @function Piler.Main.PileManager#addFile
     * @param {String} path
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addFile = function(path, options) {
      return this.add("addFile", path, options);
    };


    /**
     * @function Piler.Main.PileManager#addMultiline
     * @param {Function} path
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addMultiline = function(fn, options) {
      return this.add("addMultiline", fn, options);
    };


    /**
     * @function Piler.Main.PileManager#addRaw
     * @param {String} raw
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addRaw = function(raw, options) {
      return this.add('addRaw', raw, options);
    };


    /**
     * @function Piler.Main.PileManager#addUrl
     *
     * @param {String} url
     * @param {Object} [options={}]
     * @returns {Promise}
     */

    PileManager.prototype.addUrl = function(url, options) {
      return this.add('addUrl', url, options);
    };


    /**
     * @function Piler.Main.PileManager#pileUp
     *
     * @param {Function} [cb] You can use a callback if you want
     * @returns {Promise}
     */

    PileManager.prototype.pileUp = function(cb) {
      var options, piles;
      piles = this.piles;
      options = this.options;
      options.logger.notice("Generating assets for '" + this.type.prototype.ext + "'");
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
              options.logger.info("Wrote " + pile.ext + " pile " + pile.name + " to " + outputPath);
              return code;
            });
          } else {
            return code;
          }
        });
      }).nodeify(cb);
    };


    /**
     * @function Piler.Main.PileManager#getSources
     * @param {...*} [namespaces]
     * @returns {Promise}
     */

    PileManager.prototype.getSources = classes.utils.Q.method(function() {
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
    });

    PileManager.prototype._objectToAttr = function(obj) {
      var code, k;
      if (classes.utils._.isArray(obj)) {
        return obj.join(' ');
      } else {
        code = [];
        for (k in obj) {
          code.push("" + k + "=" + (classes.Serialize.stringify(obj[k])));
        }
        return code.join(' ');
      }
    };

    PileManager.prototype.wrapInTag = function(data) {
      return "" + data;
    };


    /**
     * @function Piler.Main.PileManager#render
     * @param {...*} [namespaces]
     * @returns {Promise} Returns the rendered tags
     */

    PileManager.prototype.render = function() {
      var namespaces;
      namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return classes.utils.Q.reduce(this.getSources.apply(this, namespaces), (function(_this) {
        return function(tags, source) {
          return tags += "" + (_this.wrapInTag(source[0], _this._objectToAttr(source[1]))) + "\n";
        };
      })(this), "");
    };


    /**
     * Add our version of render, we need to support promise locals
     * @function Piler.Main.PileManager#_render
     * @protected
     * @returns {Function}
     */

    PileManager.prototype._render = function(response) {
      return function(name, locals, callback) {
        var _locals;
        if (!classes.utils._.isObject(locals)) {
          _locals = {};
        } else {
          _locals = locals;
        }
        return classes.utils.Q.props(_locals).then(function(locals) {
          response.render(name, locals, callback);
          return locals;
        });
      };
    };


    /**
     * Assign the piler namespace on the response object
     *
     * @function Piler.Main.PileManager#locals
     */

    PileManager.prototype.locals = function(response) {
      classes.utils.objectPath.ensureExists(response, 'piler', {
        render: this._render(response)
      });
      return this;
    };


    /**
     * Stream the contents of the piles in this manager
     * @function Piler.Main.PileManager#stream
     * @returns {Stream}
     */

    PileManager.prototype.stream = function() {
      var namespace, namespaces, promises, stream;
      namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      stream = classes.utils.through();
      promises = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = namespaces.length; _i < _len; _i++) {
          namespace = namespaces[_i];
          if (this.piles[namespace]) {
            _results.push(this.piles[namespace].pileUp());
          }
        }
        return _results;
      }).call(this);
      if (promises.length) {
        classes.utils.Q.each(promises, function(value) {
          return stream.write(value);
        }).done(function() {
          stream.end();
        });
      } else {
        stream.end();
      }
      return stream;
    };


    /**
     * Find an asset from a namespace
     * @returns {Promise}
     */

    PileManager.prototype.findAssetBy = classes.utils.Q.method(function(member, search, namespace) {
      var pile;
      if (namespace == null) {
        namespace = 'global';
      }
      pile = this.piles[namespace];
      if (!pile) {
        throw new Error("namespace '" + namespace + "' not found");
      }
      return pile.findAssetBy(member, search);
    });


    /**
     * Exposes a middleware for serving your assets
     *
     * @function Piler.Main.PileManager#middleware
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
     */

    PileManager.prototype.middleware = function(options) {
      var self;
      if (options == null) {
        options = {};
      }
      debug("setting asset serving for " + this.name);
      self = this;
      return function(req, res, next) {
        var asset, pile;
        if (!req) {
          return next();
        }
        self.locals(res);
        if (!classes.utils._.startsWith(req.url, self.options.urlRoot)) {
          return next();
        }
        asset = classes.AssetUrlParse.parse(req.url);
        if (!asset) {
          debug('not an asset, skipping', req.url);
          return next();
        }
        debug('request url', req.url, 'asset', asset);
        if (asset.ext !== self.type.prototype.ext) {
          return next();
        }
        pile = self.piles[asset.name];
        if (!pile) {
          debug('pile not found', asset.name);
          res.send("Cannot find pile " + asset.name, 404);
          return;
        }
        res.setHeader("Content-type", self.contentType);
        if (asset.min) {
          if (pile.options.volatile === true) {
            debug('prod code volatile object', asset.name, asset.ext);
            pile.pileUp().then(function(code) {
              res.send(code);
              pile.clear();
              res.end();
            });
          } else {
            pile.pileUp().then(function(code) {
              res.set({
                'Cache-Control': 'max-age=31556900'
              });
              res.send(code);
              return res.end();
            });
          }
          return;
        }
        pile.findAssetBy('id', asset.dev.uid).then(function(codeOb) {
          if (codeOb) {
            debug('dev code object', codeOb);
            codeOb.contents().then(function(code) {
              res.end(code);
            });
          } else {
            res.send("Cannot find codeOb " + asset.dev.uid, 404);
            res.end();
          }
          if (pile.options.volatile === true) {
            pile.clear();
          }
        });
      };
    };

    return PileManager;

  })();
  managers = {
    PileManager: PileManager
  };
  piles = {
    BasePile: BasePile
  };
  out.production = production = process.env.NODE_ENV === "production";
  out.BasePile = BasePile;
  out.PileManager = PileManager;

  /**
   * @function Piler.addManager
   */

  /**
   * Adds a manager to Piler
   *
   * @function Piler.Main.addManager
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
   */
  out.addManager = mainExports.addManager = function(name, factoryFn) {
    var oldFn;
    oldFn = managers[name] ? managers[name] : null;
    debug("Added manager '" + name + "'");
    managers[name] = factoryFn(classes);
    return oldFn;
  };

  /**
   * @function Piler.removeManager
   */

  /**
   * Removes a manager from Piler
   *
   * @function Piler.Main.removeManager
   * @param {String} name Name of the manager
   */
  out.removeManager = mainExports.removeManager = function(name) {
    if (managers[name]) {
      delete managers[name];
    }
  };

  /**
   * @function Piler.getManager
   */

  /**
   * Get a manager from Piler
   *
   * @function Piler.Main.getManager
   * @param {String} name Name of the manager
   */
  out.getManager = mainExports.getManager = function(name) {
    return managers[name];
  };

  /**
   * @function Piler.createManager
   */

  /**
   * Create a new manager
   *
   * @function Piler.Main.createManager
   * @param {String} name Name of the manager
   * @param {Piler.Main.Add} name Name of the manager
   */
  out.createManager = mainExports.createManager = function(type, name, options) {
    if (options == null) {
      options = {};
    }
    if (!managers[type]) {
      throw new Error("Manager " + type + " not available");
    }
    if (classes.utils._.isObject(name)) {
      options = name;
      name = null;
    }
    if (!name) {
      name = type;
    }
    return new managers[type](name, options);
  };

  /**
   * @function Piler.addPile
   */

  /**
   * Adds a pile to Piler
   *
   * @function Piler.Main.addPile
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
   */
  out.addPile = mainExports.addPile = function(name, factoryFn) {
    var oldFn;
    oldFn = piles[name] ? piles[name] : function() {};
    debug("Added pile '" + name + "'");
    piles[name] = factoryFn(classes);
    return oldFn;
  };

  /**
   * @function Piler.getPile
   */

  /**
   * Get a pile from Piler
   *
   * @function Piler.Main.getPile
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
   */
  out.getPile = mainExports.getPile = function(name) {
    return piles[name];
  };

  /**
   * @function Piler.removePile
   */

  /**
   * Removes a pile from Piler
   *
   * @function Piler.Main.removePile
   * @param {String} name Name of the pile
   */
  out.removePile = mainExports.removePile = function(name) {
    if (piles[name]) {
      delete piles[name];
    }
  };
  return out;
};
