module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Main
  ###

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Main}
     * @function Piler.Main.debug
    ###
    debug: debug = classes.utils.debug("piler:piler")
  }

  bindFn = (_this, name) -> (fn, before) ->
    debug("res #{name}", fn)
    _this[name] "__temp", fn, before
    return

  class BasePile
    ###*
     * @constructor Pìler.Main.BasePile
    ###
    constructor: (@name, @options = {}) ->
      @assets = []
      @rawPile = null
      @options.cacheKeys ?= true
      @options.volatile ?= false
      @options.urlRoot ?= '/piler/'
      @options.production ?= false

    ###*
     * @memberof Piler.Main.BasePile
     * @function add
    ###
    add: (config, before = false) ->
      @assets[if not before then 'push' else 'unshift'] classes.Serialize.serialize.call
        type: config.type
        adjustFilename: !!config.adjustFilename
        object: config.object
        fromUrl: !!config.fromUrl
      @

    ###*
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
    ###
    addFile: (filePath, before = false) ->
      filePath = classes.utils.path.normalize filePath
      if filePath not in @getFilePaths()
        @add({type: "file", adjustFilename: true, object: filePath, fromUrl: true}, before)

      @

    reset: ->
      if @options.volatile
        @assets.length = 0
        @rawPile = null
      @

    ###*
     * @memberof Piler.Main.BasePile
     * @function addRaw
     * @param {*} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.BasePile} `this`
    ###
    addRaw: (raw, before = false) ->
      @add({type: "raw", object: raw}, before)

    getObjects: (type) ->
      (ob.object for ob in @code when ob.type is type)

    ###*
     * @memberof Piler.Main.BasePile
     * @function addUrl
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.BasePile} `this`
    ###
    addUrl: (url, before = false) ->
      if url not in @getObjects('url')
        @add({type:'url', object:url}, before)

      @

    ###*
     * @memberof Piler.Main.BasePile
     * @function getSources
     * @instance
     * @returns {Array.<String>} Array of sources
    ###
    getSources: ->
      # Start with plain urls
      sources = ([u] for u in @urls)

      if @options.production
        sources.push ["#{ @options.urlRoot }min/#{ @pileHash }/#{ @name }.#{ @ext }"]
      else
        devCacheKey = ''

        if @options.cacheKeys
          devCacheKey = "?v=#{Date.now()}"

        for ob in @assets
          sources.push ["#{ @options.urlRoot }dev/#{ @name }.#{ ob.type }-#{ ob.getId() }.#{ @ext }#{devCacheKey}", "id=\"pile-#{ ob.getId() }\""]

      return sources

    findAssetBy: (member, search) ->
      (obj for obj in @assets when obj[member]() is search)[0]

    ###*
     * @memberof Piler.Main.BasePile
     * @function _computeHash
     * @instance
     * @private
     *
     * @returns {String}
    ###
    _computeHash: ->
      @pileHash = classes.Serialize.sha1(@rawPile, 'hex')

    minify: (code, options = {}) ->
      return code if not @ext

      if @production
        classes.Minify.minify @ext, code, classes.utils._.merge({noCache: @options.volatile}, options)
      else
        code

    ###*
     * @memberof Piler.Main.BasePile
     * @function pileUp
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      self = @

      classes.utils.Q.map(@code, (codeOb) ->

        codeOb.getCode().then (code) ->
          self.commentLine("#{ codeOb.type }: #{ codeOb.getId() }") + "\n#{ code }"

      ).then(
        (result) ->
          self.rawPile = self.minify result.join("\n\n").trim()
          self._computeHash()
          self.rawPile
        (err) ->
          err
      ).nodeify(cb)


  defNs = (fn) ->
    (ns, obj, before = false) ->
      if arguments.length is 1
        obj = ns
        ns = "global"

      fn.call @, ns, obj, before

  ###*
   * @typedef {Object} Piler.Main.PileSettings
   * @property {Boolean} cacheKeys
   * @property {Boolean} volatile
   * @property {String} urlRoot
   * @property {Object} logger
  ###

  class PileManager
    ###*
     * @memberof Piler.Main.PileManager
     * @member {Piler.Main.BasePile} type
     * @instance
    ###
    type: null

    ###*
     * @constructor Piler.Main.PileManager
    ###
    constructor: (@options) ->
      @options.urlRoot ?= "/pile/"
      @options.logger ?= classes.Logger

      @piles = {}

      @getPile "global"
      @getPile "__temp", {volatile: true}

    ###*
     * @memberof Piler.Main.PileManager
     * @instance
     * @param {String} ns
     * @param {Piler.Main.PileSettings} settings
     * @function getPile
     * @returns {Piler.Main.BasePile} `this`
    ###
    getPile: (ns, settings = {}) ->
      pile = @piles[ns]
      if not pile
        pile =  @piles[ns] = new @type ns, settings
      pile

    add: defNs (ns, type, before) ->
      pile = @getPile ns
      pile["add#{type}"]()

    ###*
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
    ###
    addFiles: defNs (ns, arr, before = false) ->
      @addFile(ns, file, before) for file in arr

      @

    ###*
     * @memberof Piler.Main.PileManager
     * @instance
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @function addFile
     * @returns {Piler.Main.PileManager} `this`
    ###
    addFile: defNs (ns, path, before = false) ->
      pile = @getPile ns
      pile.addFile path, before
      @

    ###*
     * @memberof Piler.Main.PileManager
     * @function addRaw
     * @param {String} ns
     * @param {String} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.PileManager} `this`
    ###
    addRaw: defNs (ns, raw, before = false) ->
      pile = @getPile ns
      pile.addRaw raw, before
      @

    ###*
     * @memberof Piler.Main.PileManager
     * @function addUrl
     * @param {String} ns
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.Main.PileManager} `this`
    ###
    addUrl: defNs (ns, url, before = false) ->
      pile = @getPile ns
      pile.addUrl url, before
      @

    ###*
     * @memberof Piler.Main.PileManager
     * @function pileUp
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      logger = @logger
      piles = @piles
      options = @options
      logger.notice "Start assets generation for '#{ @type::ext }'"

      classes.utils.Q.map(Object.keys(piles), (name) ->
        pile = piles[name]

        pile.pileUp().then(
          (code) ->

            if options.outputDirectory
              # skip volatile piles
              return code if pile.options.volatile is true

              outputPath = classes.utils.path.join options.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

              classes.utils.fs.writeFileAsync(outputPath, code).then ->
                logger.info "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"
                code

            else
              code
        )
      ).nodeify(cb)

    ###*
     * @memberof Piler.Main.PileManager
     * @instance
     * @param {...*} [namespaces]
     * @returns {Array.<String>} Array of sources
    ###
    getSources: (namespaces...) ->
      if typeof classes.utils._.last(namespaces) is "object"
        opts = namespaces.pop()
      else
        opts = {}

      if not opts.disableGlobal
        namespaces.unshift "global"

      if not opts.disableTemp
        namespaces.push "__temp"

      sources = []

      for ns in namespaces
        if pile = @piles[ns]
          sources.push pile.getSources()...

      sources

    ###*
     * @memberof Piler.Main.PileManager
     * @param {...*} [namespaces]
     * @instance
     * @returns {String} Rendered tags
    ###
    renderTags: (namespaces...) ->

      tags = ""
      for src in @getSources namespaces...
        tags += @wrapInTag src[0], src[1]
        tags += "\n"

      tags

    ###*
     * @memberof Piler.Main.PileManager
     * @function bind
     * @param {Express} app Express application
     * @param {http.Server} server HTTP server
     * @instance
     * @returns {Piler.Main.PileManager} `this`
    ###
    bind: (app, server) ->
      if not server
        throw new Error('You must pass an existing server to bind function as second parameter')

      @app = app
      @server = server

      server.on "listening", =>
        @pileUp()
        return

      @setMiddleware?(app)

      debug('setting asset serving')

      app.use (req, res, next) =>
        if not classes.utils._.startsWith req.url, @settings.urlRoot
          return next()

        res.setHeader "Content-type", @contentType
        asset = classes.AssetUrlParse.parse req.url

        debug('request url', req.url, 'asset', asset)

        # Wrong asset type. Lets skip to next middleware.
        if asset.ext isnt @type::ext
          return next()

        pile = @piles[asset.name]

        if not pile
          debug('pile not found', asset.name)

          res.send "Cannot find pile #{ asset.name }", 404
          return

        if asset.min
          if pile.options.volatile is true
            debug('prod code volatile object', asset.name, asset.ext)

            pile.pileUp((err, code) ->
              throw err if err
              res.send code
              pile.reset()
              res.end()
              return
            )

          else
            res.set(
              'Cache-Control': 'max-age=31556900'
            )
            res.send pile.rawPile
            res.end()

          return

        codeOb = pile.findCodeObById asset.dev.uid

        if codeOb
          debug('dev code object', codeOb)
          codeOb.getCode (err, code) ->
            throw err if err
            res.end code
            return
        else
          res.send "Cannot find codeOb #{ asset.dev.uid }", 404

        if pile.options.volatile is true
          pile.reset()

        return

      @

  out.production = production = process.env.NODE_ENV is "production"

  out.BasePile = mainExports.BasePile = BasePile
  out.PileManager = mainExports.PileManager = PileManager

