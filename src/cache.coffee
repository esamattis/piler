module.exports = (Piler, mainExports) ->
  #
  # Don't uglify again files if they didn't change
  #

  os = require 'os'

  # e.g. /var/folders/zm/jmjb49l172g6g_h1y8701spc0000gn/T/
  TMPDIR = os.tmpDir()

  debug: debug = Piler.utils.debug('piler:cache')
  # Return a compressed version (already cached or not) of `code`, this function is synchronous
  cache: (code, fnCompress) ->
    if options.enable isnt true
      debug('minified code cache isnt enabled')
      return fnCompress()

    hash = Piler.Serialize.sha1(code, 'hex')

    if options.useFS is true
      file = Piler.utils.path.join TMPDIR, '/', hash

      debug('using filesystem.', 'hash:', hash, 'file:', file)

      if Piler.utils.fs.existsSync(file)
        debug('file already in cache')
        # if already in cache
        return Piler.utils.fs.readFileSync(file, {encoding: 'utf8'})

      # if not: compress the code
      cache = fnCompress()

      # write the file
      Piler.utils.fs.writeFileSync(file, cache, {encoding: 'utf8'})

      # .. and return the compressed version
      cache
    else
      debug('not using file system. calling custom callback.', 'hash:', hash)
      options.cacheCallback(code, hash, fnCompress)

  options: options =
    enable: true
    useFS: true
    cacheCallback: (code, hash, fnCompress) ->
      fnCompress()

  ###*
   * @typedef {Function} Piler.cacheFn
   * @param {String} code The raw code itself
   * @param {String} hash The current sha1 of the code
   * @param {Function} code Execute the minify routine that generates code
   * @returns {String}
  ###
  ###*
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
  ###
  useCache: mainExports.useCache = (cacheFn) ->
    throw new Error('useCache expects a function') if not Piler.utils._.isFunction(cacheFn)
    throw new Error('useCache expects a function with 3 arguments defined') if cacheFn.length < 3

    options.useFS = false
    options.cacheCallback = cacheFn

    return