module.exports = function(Piler, mainExports) {

  /**
   * @namespace Piler.Cache
   */
  var TMPDIR, caches, debug, fileCacheCallback, os;
  os = require('os');
  TMPDIR = os.tmpDir();

  /**
   * Execute this callback when there's no cache, so you can retrieve the code
   *
   * @typedef {Function} Piler.Cache.ProcessCallback
   * @example
   *   callback().then(function(code){
   *     return code;
   *   });
   *   // or
   *   callback(function(err, code){
   *     return code;
   *   });
   *
   * @param {Piler.NodeCallback} [cb] Pass in a callback instead
   * @returns {Promise|*} Do the processing
   */
  fileCacheCallback = function(hash, processCallback) {
    var file;
    file = Piler.utils.path.join(TMPDIR, hash);
    debug('using filesystem.', 'hash', hash, 'file', file);
    return Piler.utils.fs.readFileAsync(file).then(function(contents) {
      debug('file already in cache');
      return contents.toString();
    }, function() {
      debug('caching', file);
      return processCallback().then(function(code) {
        return Piler.utils.fs.writeFileAsync(file, code).then(function() {
          return code;
        });
      });
    });
  };
  caches = {
    contents: {
      enabled: true,
      callback: fileCacheCallback
    },
    pre: {
      enabled: true,
      callback: fileCacheCallback
    },
    post: {
      enabled: true,
      callback: fileCacheCallback
    }
  };
  return {

    /**
     * Output debug messages as if it was from {@link Piler.Cache Cache}
     *
     * @function Piler.Cache.debug
     */
    debug: debug = Piler.utils.debug('piler:cache'),

    /**
     * Return the code, regardless of cached or not.
     *
     * @function Piler.Cache.cache
     *
     * @example
     *   Piler.Cache.cache('some id', function(){
     *     return 'Im code that will get cached';
     *   }, 'contents', function(err, code){
     *     // will always yield 'Im code that will get cached' if no error happens
     *   });
     *   // or using promises
     *   Piler.Cache.cache(
     *     'some id',
     *     function(){
     *       return 'Im code that will get cached';
     *     },
     *     'contents'
     *   ).then(function(code){
     *     // will "always" yield 'Im code that will get cached' if no error happens
     *   });
     *
     *
     * @param {String} identifier Any kind of identification, will be converted to a sha1 hash
     * @param {Function} processFn Function that return a string value or a promise
     * @param {String} type Type of cache
     * @param {Piler.NodeCallback} [cb] Optional callback
     *
     * @returns {Promise}
     */
    cache: function(identifier, processFn, type, cb) {
      var cache, hash, process;
      if (!type || !caches[type]) {
        debug('cache type not found', type ? type : void 0);
        return Piler.utils.Promise["try"](processFn).nodeify(cb);
      }
      cache = caches[type];
      if (cache.enabled !== true) {
        debug('code cache isnt enabled for', type);
        return Piler.utils.Promise["try"](processFn).nodeify(cb);
      }
      process = (function(processFn) {
        return function(fn) {
          if (fn && Piler.utils._.isFunction(fn)) {
            return Piler.utils.Promise["try"](processFn).then(function(result) {
              return fn(null, result);
            }, function(err) {
              return fn(err);
            });
          } else {
            return Piler.utils.Promise["try"](processFn);
          }
        };
      })(processFn);
      hash = Piler.Serialize.sha1(identifier, 'hex');
      return Piler.utils.Promise["try"](function() {
        return cache.callback(hash, process);
      }).nodeify(cb);
    },

    /**
     * A function that get's called when a cache call is made
     *
     * @typedef {Function} Piler.Cache.CacheFn
     * @example
     *   function(hash, callback) {
     *     // hash "should" be unique. execute the callback when you need to retrieve the code
     *     // (aka, there's no cached code)
     *     return callback(function(err, code){
     *       // store your "code" alongside your hash
     *       // then return it
     *       return keepInMemory[hash] = code;
     *     });
     *     // or with promises
     *     return callback().then(function(code){
     *       // store your "code" alongside your hash
     *       return code;
     *     });
     *   }
     * @param {String} hash The current sha1 of the code
     * @param {Function|Promise} callback Execute the routine that generates code
     * @returns {Promise|*}
     */

    /**
     * Get a registered cache
     *
     * @function Piler.Cache.getCache
     * @param  {String} name Name of the cache. Built-in caches are 'contents','pre' and 'post'
     * @returns {Piler.Cache.CacheFn}
     */
    getCache: mainExports.getCache = function(name) {
      return caches[name];
    },

    /**
     * @function Piler.useCache
     */

    /**
     * Add the cache method. By default it uses the filesystem. When you assign a function by yourself, it will override
     * the internal one.
     *
     * @example
     *   var memoryCache = {};
     *
     *   piler.useCache(['contents','pre','post'], function(hash, getCode) {
     *     if (typeof memoryCache[hash] === 'undefined') {
     *       return getCode(function(err, code){
     *         memoryCache[hash] = code;
     *         return code;
     *       });
     *     }
     *     return memoryCache[hash];
     *   });
     *   // or one type of cache only, only for file contents
     *   piler.useCache(['contents'], function(hash, getCode) {
     *     if (typeof memoryCache[hash] === 'undefined') {
     *       return getCode().then(function(code){
     *         memoryCache[hash] = code;
     *         return code;
     *       });
     *     }
     *     return memoryCache[hash];
     *   });
     *
     * @param {String|Array|Function} [type=['contents','pre','post']] Type(s) of caches, you can go beyond the built-in types
     * @param {Piler.Cache.CacheFn} cacheFn Function that will be called with content
     * @throws Error
     *
     * @function Piler.Cache.useCache
     */
    useCache: mainExports.useCache = function(type, cacheFn) {
      var t, _i, _len;
      if (!Piler.utils._.isFunction(cacheFn) && !Piler.utils._.isFunction(type)) {
        throw new Error('useCache expects at least a function');
      }
      if (Piler.utils._.isFunction(type)) {
        cacheFn = type;
        type = ['contents', 'pre', 'post'];
      }
      type = Piler.utils.ensureArray(type);
      for (_i = 0, _len = type.length; _i < _len; _i++) {
        t = type[_i];
        if (caches[t]) {
          debug('Overwriting cache', t);
        } else {
          caches[t] = {};
        }
        caches[t].enabled = true;
        caches[t].callback = cacheFn;
      }
    }
  };
};
