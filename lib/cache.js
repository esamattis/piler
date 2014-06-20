module.exports = function(Piler, mainExports) {

  /**
   * @namespace Piler.Cache
   */
  var TMPDIR, debug, options, os;
  os = require('os');
  TMPDIR = os.tmpDir();
  return {

    /**
     * Output debug messages as if it was from {@link Piler.Cache}
     * @function Piler.Cache.debug
     */
    debug: debug = Piler.utils.debug('piler:cache'),

    /**
     * Return a compressed version (already cached or not) of `code`
     *
     * @function Piler.Cache.cache
     * @param {String} code
     * @param {Function} fnCompress Function that returns a value or a promise
     */
    cache: function(code, fnCompress) {
      var cache, file, hash;
      if (options.enable !== true) {
        debug('minified code cache isnt enabled');
        return fnCompress();
      }
      hash = Piler.Serialize.sha1(code, 'hex');
      if (options.useFS === true) {
        file = Piler.utils.path.join(TMPDIR, '/', hash);
        debug('using filesystem.', 'hash:', hash, 'file:', file);
        if (Piler.utils.fs.existsSync(file)) {
          debug('file already in cache');
          return Piler.utils.fs.readFileSync(file, {
            encoding: 'utf8'
          });
        }
        cache = fnCompress();
        Piler.utils.fs.writeFileSync(file, cache, {
          encoding: 'utf8'
        });
        return cache;
      } else {
        debug('not using file system. calling custom callback.', 'hash:', hash);
        return options.cacheCallback(code, hash, fnCompress);
      }
    },
    options: options = {
      enable: true,
      useFS: true,
      cacheCallback: function(code, hash, fnCompress) {
        return fnCompress();
      }
    },

    /**
     * @typedef {Function} Piler.Cache.CacheFn
     * @param {String} code The raw code itself
     * @param {String} hash The current sha1 of the code
     * @param {Function} code Execute the minify routine that generates code
     * @returns {String}
     */

    /**
     * @function Piler.useCache
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
     * @param {Piler.Cache.CacheFn} cacheFn Function that will be called with the current code, generated hash and the callback
     * @throws Error
     *
     * @function Piler.Cache.useCache
     */
    useCache: mainExports.useCache = function(cacheFn) {
      if (!Piler.utils._.isFunction(cacheFn)) {
        throw new Error('useCache expects a function');
      }
      if (cacheFn.length < 3) {
        throw new Error('useCache expects a function with 3 arguments defined');
      }
      options.useFS = false;
      options.cacheCallback = classes.utils.Q.method(cacheFn);
    }
  };
};
