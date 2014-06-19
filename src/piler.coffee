module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler
  ###

  out = {
    debug: debug = classes.utils.debug("piler:piler")
  }

  bindFn = (_this, name) -> (fn, before) ->
    debug("res #{name}", fn)
    _this[name] "temp", fn, before
    return

  class BasePile extends require('events').EventEmitter
    ###*
     * @member {String} urlRoot
     * @instance
     * @memberof Piler.BasePile
    ###
    urlRoot: "/piler/"

    ###*
     * @member {Boolean} production
     * @instance
     * @memberof Piler.BasePile
    ###
    production: false

    ###*
     * @constructor Piler.BasePile
    ###
    constructor: (@name, @production, urlRoot, @options = {}) ->
      super()

      if urlRoot?
        @urlRoot = urlRoot

      @code = []
      @rawPile = null
      @urls = []
      @piledUp = false
      @options.cacheKeys ?= true
      @options.volatile ?= false

      @on('before', ->
      )
      @on('after', ->
      )

    ###*
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
    ###
    addFile: (filePath, before = false) ->
      filePath = classes.utils.path.normalize filePath
      @warnPiledUp "addFile"
      if filePath not in @getFilePaths()
        @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
          type: "file"
          filePath: filePath

      @

    reset: ->
      if @options.volatile
        @code.length = 0
        @urls.length = 0
        @rawPile = null
      @

    ###*
     * @memberof Piler.BasePile
     * @function addRaw
     * @param {*} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.BasePile} `this`
    ###
    addRaw: (raw, before = false) ->
      @warnPiledUp "addRaw"
      @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
        type: "raw"
        raw: raw

      @

    ###*
     * @memberof Piler.BasePile
     * @function getFilePaths
     * @instance
     * @returns {Array.<String>} Array of file paths
    ###
    getFilePaths: ->
      (ob.filePath for ob in @code when ob.type is "file")

    ###*
     * @memberof Piler.BasePile
     * @function addUrl
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.BasePile} `this`
    ###
    addUrl: (url, before = false) ->
      if url not in @urls
        @urls[if not before then 'push' else 'unshift'] url

      @

    ###*
     * @memberof Piler.BasePile
     * @function getSources
     * @instance
     * @returns {Array.<String>} Array of sources
    ###
    getSources: ->
      # Start with plain urls
      sources = ([u] for u in @urls)

      if @production
        sources.push ["#{ @urlRoot }min/#{ @pileHash }/#{ @name }.#{ @ext }"]
      else
        devCacheKey = ''
        if @options.cacheKeys
          devCacheKey = "?v=#{Date.now()}"
        for ob in @code
          sources.push ["#{ @urlRoot }dev/#{ @name }.#{ ob.type }-#{ ob.getId() }.#{ @ext }#{devCacheKey}", "id=\"pile-#{ ob.getId() }\""]

      return sources

    ###*
     * @memberof Piler.BasePile
     * @function findCodeObById
     * @param {String} id
     * @instance
     * @returns {Piler.codeOb}
    ###
    findCodeObById: (id) ->
      (codeOb for codeOb in @code when codeOb.getId() is id)[0]

    ###*
     * @memberof Piler.BasePile
     * @function findCodeObByFilePath
     * @param {String} path
     * @instance
     * @returns {Piler.codeOb}
    ###
    findCodeObByFilePath: (path) ->
      (codeOb for codeOb in @code when codeOb.filePath is path)[0]

    ###*
     * @memberof Piler.BasePile
     * @function _computeHash
     * @instance
     * @private
     *
     * @returns {String}
    ###
    _computeHash: ->
      @pileHash = classes.Serialize.sha1(@rawPile, 'hex')

    ###*
     * @memberof Piler.BasePile
     * @function warnPiledUp
     * @instance
     * @protected
    ###
    warnPiledUp: (fnname) ->
      if @logger and @piledUp and @options.volatile isnt true
        @logger.warn "Warning pile #{ @name } has been already piled up. Calling #{ fnname } does not do anything."

      return

    minify: (code, options = {}) ->
      return code if not @ext

      if @production
        classes.Minify.minify @ext, code, classes.utils._.merge({noCache: @options.volatile}, options)
      else
        code

    ###*
     * @memberof Piler.BasePile
     * @function pileUp
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      if @options.volatile isnt true
        @piledUp = true

      self = @

      classes.utils.Q.map(@code, (codeOb) ->

        d = classes.utils.Q.defer()

        codeOb.getCode (err, code) ->
          return d.reject(err) if err
          d.resolve self.commentLine("#{ codeOb.type }: #{ codeOb.getId() }") + "\n#{ code }"
          return

        d.promise

      ).then(
        (result) ->
          self.rawPile = self.minify result.join("\n\n").trim()
          self._computeHash()
          self.rawPile
        (err) ->
          err
      ).nodeify(cb)

  class JSPile extends BasePile
    ###*
     * @member {String} ext
     * @memberof Piler.JSPile
     * @instance
    ###
    ext: "js"

    ###*
     * Add line comment
     *
     * @function commentLine
     * @memberof Piler.JSPile
     * @returns {String}
     * @instance
    ###
    commentLine: (line) ->
      "// #{ line.trim() }"

    ###*
     * @augments Piler.BasePile
     * @constructor Piler.JSPile
    ###
    constructor: ->
      super

    ###*
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @function addModule
     * @param {String} filePath
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.JSPile} `this`
    ###
    addModule: (filePath, before = false) ->
      filePath = classes.utils.path.normalize filePath
      @warnPiledUp "addFile"
      if filePath not in @getFilePaths()
        @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
          type: "module"
          filePath: filePath
      @

    ###*
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @param {Object} ob
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.JSPile} `this`
    ###
    addOb: (ob, before = false) ->
      @warnPiledUp "addOb"
      @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
        type: "object"
        object: ob
      @

    ###*
     * Add a CommonJS module
     * @memberof Piler.JSPile
     * @param {Function} fn
     * @param {Boolean} [before=false]
     * @instance
     * @function addExec
     * @returns {Piler.JSPile} `this`
    ###
    addExec: (fn, before = false) ->
      @warnPiledUp "addExec"
      @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
        type: "exec"
        object: fn
      @

  class CSSPile extends BasePile
    ###*
     * @member {String} ext
     * @memberof Piler.CSSPile
     * @instance
    ###
    ext: "css"

    ###*
     * @constructor Piler.CSSPile
     * @augments Piler.BasePile
    ###
    constructor: ->
      super

    ###*
     * Add a line comment to CSS
     *
     * @memberof Piler.CSSPile
     * @param {String} line
     * @instance
     * @function commentLine
     * @returns {Piler.CSSPile} `this`
    ###
    commentLine: (line) ->
      return "/* #{ line.trim() } */"


  defNs = (fn) ->
    (ns, path, before = false) ->
      if arguments.length is 1
        path = ns
        ns = "global"
      fn.call @, ns, path, before

  ###*
   * @typedef {Object} Piler.PileSettings
   * @property {Boolean} cacheKeys
   * @property {Boolean} volatile
  ###

  class PileManager
    ###*
     * @memberof Piler.PileManager
     * @member {Piler.BasePile} Type
     * @instance
    ###
    Type: null

    ###*
     * @constructor Piler.PileManager
    ###
    constructor: (@settings) ->
      @production = @settings.production
      @settings.urlRoot ?= "/pile/"
      @logger = @settings.logger or classes.Logger

      @piles = {}

      @getPile "global"
      @getPile "temp", {volatile: true}

      return

    ###*
     * @memberof Piler.PileManager
     * @instance
     * @param {String} ns
     * @param {Piler.PileSettings} settings
     * @function getPile
     * @returns {Piler.BasePile} `this`
    ###
    getPile: (ns, settings = {}) ->
      pile = @piles[ns]
      if not pile
        pile =  @piles[ns] = new @Type ns, @production, @settings.urlRoot, settings
      pile

    ###*
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
    ###
    addFiles: defNs (ns, arr, before = false) ->
      @addFile(ns, file, before) for file in arr

      @

    ###*
     * @memberof Piler.PileManager
     * @instance
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @function addFile
     * @returns {Piler.PileManager} `this`
    ###
    addFile: defNs (ns, path, before = false) ->
      pile = @getPile ns
      pile.addFile path, before
      @

    ###*
     * @memberof Piler.PileManager
     * @function addRaw
     * @param {String} ns
     * @param {String} raw
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.PileManager} `this`
    ###
    addRaw: defNs (ns, raw, before = false) ->
      pile = @getPile ns
      pile.addRaw raw, before
      @

    ###*
     * @memberof Piler.PileManager
     * @function addUrl
     * @param {String} ns
     * @param {String} url
     * @param {Boolean} [before=false]
     * @instance
     * @returns {Piler.PileManager} `this`
    ###
    addUrl: defNs (ns, url, before = false) ->
      pile = @getPile ns
      pile.addUrl url, before
      @

    ###*
     * @memberof Piler.PileManager
     * @function pileUp
     * @param {Function} [cb]
     * @instance
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      logger = @logger
      piles = @piles
      settings = @settings
      logger.notice "Start assets generation for '#{ @Type::ext }'"

      classes.utils.Q.map(Object.keys(piles), (name) ->
        pile = piles[name]

        pile.pileUp().then(
          (code) ->
            d = classes.utils.Q.defer()

            if settings.outputDirectory?
              # skip volatile piles
              return code if pile.options.volatile is true

              outputPath = classes.utils.path.join settings.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

              classes.utils.fs.writeFile outputPath, code, (err) ->
                d.reject(err) if err
                logger.info "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"
                d.resolve(code)
                return

            else
              d.resolve(code)

            d.promise
        )
      ).nodeify(cb)

    ###*
     * @memberof Piler.PileManager
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
        namespaces.push "temp"

      sources = []
      for ns in namespaces
        if pile = @piles[ns]
          sources.push pile.getSources()...

      return sources

    ###*
     * @memberof Piler.PileManager
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
     * @memberof Piler.PileManager
     * @function bind
     * @param {Express} app Express application
     * @param {http.Server} server HTTP server
     * @instance
     * @returns {Piler.PileManager} `this`
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
        if asset.ext isnt @Type::ext
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

  class JSManager extends PileManager
    Type: JSPile
    contentType: "application/javascript"

    ###*
     * @constructor Piler.JSManager
     * @augments Piler.PileManager
    ###
    constructor: ->
      super

      @piles.global.addExec ->
        window._NS = (nsString) ->
          parent = window
          for ns in nsString.split "."
            # Create new namespace if it is missing
            parent = parent[ns] ?= {}
          parent # return the asked namespace

        window.__SET = (ns, ob) ->
          parts = ns.split "."
          if parts.length is 1
            window[parts[0]] = ob
          else
            nsOb = _NS(parts.slice(0, -1).join("."))
            target = parts.slice(-1)[0]
            nsOb[target] = ob

      return

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @function wrapInTag
     * @returns {String}
    ###
    wrapInTag: (uri, extra="") ->
      "<script type=\"text/javascript\"  src=\"#{ uri }\" #{ extra } ></script>"

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @private
     * @param {String} ns
     * @function _isReserved
     * @throws Error
    ###
    _isReserved: (ns) ->
      if classes.utils.reserved.indexOf(ns) isnt -1
        throw new Error("#{ns} is a reserved word and can't be used")

      return

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @function addModule
     * @returns {Piler.JSManager} `this`
    ###
    addModule: defNs (ns, path, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addModule path, before
      @

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @param {String} ns
     * @param {String} ob
     * @param {Boolean} [before=false]
     * @function addOb
     * @returns {Piler.JSManager} `this`
    ###
    addOb: defNs (ns, ob, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addOb ob, before
      @

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @function addExec
     * @param {String} ns
     * @param {String} fn
     * @param {Boolean} [before=false]
     * @returns {Piler.JSManager} `this`
    ###
    addExec: defNs (ns, fn, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addExec fn, before
      @

    ###*
     * @memberof Piler.JSManager
     * @instance
     * @function setMiddleware
     * @returns {Piler.JSManager} `this`
    ###
    setMiddleware: (app) ->
      debug('setting JSManager middleware')
      _this = @

      # Middleware that adds add & exec methods to response objects.
      app.use (req, res, next) ->
        res.piler ?= {}
        res.piler.js ?= {}

        res.piler.js =
          addExec: bindFn(_this, 'addExec')
          addRaw: bindFn(_this, 'addRaw')
          addOb: bindFn(_this, 'addOb')
          addModule: bindFn(_this, 'addModule')
          addFile: bindFn(_this, 'addFile')
          addUrl: bindFn(_this, 'addUrl')

        next()

        return

      @

  class CSSManager extends PileManager
    ###*
     * @member {CSSPile} Type
     * @memberof Piler.CSSManager
     * @instance
    ###
    Type: CSSPile
    ###*
     * @member {String} contentType
     * @memberof Piler.CSSManager
     * @instance
    ###
    contentType: "text/css"

    ###*
     * @constructor Piler.CSSManager
     * @augments Piler.PileManager
    ###
    constructor: ->
      super

    ###*
     * Wrap a stylesheet path in a link tag
     *
     * @memberof Piler.CSSManager
     * @function wrapInTag
     * @instance
     * @returns {String}
    ###
    wrapInTag: (uri, extra="") ->
      "<link rel=\"stylesheet\" href=\"#{ uri }\" #{ extra } />"

    ###*
     * @memberof Piler.CSSManager
     * @function setMiddleware
     * @instance
    ###
    setMiddleware: (app) ->
      debug('setting CSSManager middleware')
      _this = @

      # Middleware that adds add & exec methods to response objects.
      app.use (req, res, next) ->
        res.piler ?= {}
        res.piler.css ?= {}

        res.piler.css.addRaw = bindFn(_this, 'addRaw')
        res.piler.css.addFile = bindFn(_this, 'addFile')
        res.piler.css.addUrl = bindFn(_this, 'addUrl')

        next()

        return

      return

  classes.utils._.extend JSManager::, classes.LiveCSS.LiveUpdateMixin::

  out.production = production = process.env.NODE_ENV is "production"

  out.BasePile = mainExports.BasePile = BasePile
  out.CSSPile = mainExports.CSSPile = CSSPile
  out.JSPile = mainExports.JSPile = JSPile
  out.JSManager = mainExports.JSManager = JSManager
  out.CSSManager = mainExports.CSSManager = CSSManager

  ###*
   * Create a new JS Manager for adding Javascript files
   *
   * @param {Object} [settings] Settings to pass to JSManager
   *
   * @function Piler.createJSManager
   * @returns {Piler.JSManager}
  ###
  out.createJSManager = mainExports.createJSManager = (settings={}) ->
    settings.production = production
    new JSManager settings

  ###*
   * Create a new CSS Manager for adding stylesheet files
   *
   * @function Piler.createCSSManager
   *
   * @param {Object} [settings] Settings to pass to CSSManager
   * @returns {Piler.CSSManager}
  ###
  out.createCSSManager = mainExports.createCSSManager = (settings={}) ->
    settings.production = production
    new CSSManager settings

  out

