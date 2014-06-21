module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Main
  ###

  op = classes.utils.objectPath

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Main}
     * @function Piler.Main.debug
    ###
    debug: debug = classes.utils.debug("piler:main")
  }

  ###*
   * Config object for {@link Piler.Main.BasePile BasePile} and {@link Piler.Main.PileManager PileManager}
   * @typedef {Object} Piler.Main.Config
  ###

  ###*
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
  ###

  class BasePile
    ###*
     * @constructor Piler.Main.BasePile
     *
     * @param {String} name
     * @param {Piler.Main.Config} [options={}]
    ###
    constructor: (@name, @options = {}) ->
      @assets = []
      @rawPile = null
      @pileHash = ''

      classes.utils._.defaults(@options, {
        cacheKeys: true
        volatile: false
        urlRoot: '/piler/'
        production: false
      })

      return

    ###*
     * All add* calls ends here. Add an asset and mutate extend the passed
     * configuration with mixins from {@link Piler.Serialize.CodeObject}
     *
     * @function Piler.Main.BasePile#add
     * @param {Piler.Main.AddConfig} config
     * @returns {Piler.Main.BasePile} `this`
    ###
    add: (config) ->
      throw new Error('add expects an object as parameter') if not classes.utils._.isObject(config)

      op.ensureExists(config, 'options', {})

      config.options = classes.utils._.defaults(config.options, {
        filePath: false
        asIs: false
        noSumContent: false
        before: false
      })

      type = if not config.options.before then 'push' else 'unshift'

      @assets[type] object = classes.Serialize.serialize.call
        type: config.type
        object: config.object
        options: config.options

      object

    ###*
     * Adds a multiline that will be converted to a string later (or can be compiled to any code)
     *
     * @function Piler.Main.BasePile#addMultiline
     * @returns {Piler.Main.BasePile}
    ###
    addMultiline: (fn, options = {}) ->
      @add({type: "multiline", object: fn, options})
      @

    ###*
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
    ###
    addFile: (filePath, options = {}) ->
      filePath = classes.utils.path.normalize filePath
      if filePath not in @getObjects('file')
        options = classes.utils._.defaults(options, {noSumContent: true, filePath: true})
        @add({type: "file", object: filePath, options})

      @

    ###*
     * @function  Piler.Main.BasePile#addUrl
     * @param {String} url
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    addUrl: (url, options = {}) ->
      @getObjects('url').then (urls) ->
        if url not in urls
          options = classes.utils._.defaults(options, {asIs: true})
          @add({type: 'url', object: url, options})

      @

    ###*
     * @function Piler.Main.BasePile#addRaw
     * @param {*} raw
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    addRaw: (raw, options = {}) ->
      @add({type: "raw", object: raw, options})
      @

    ###*
     * @function Piler.Main.BasePile#getObjects
     *
     * @returns {Promise} The result of the promise will be an array of the desired
    ###
    getObjects: (filter, member = 'object') ->
      if filter
        classes.utils.Q.all (ob[member]() for ob in @assets when ob.type() is filter)
      else
        classes.utils.Q.all (ob[member]() for ob in @assets)

    ###*
     * Clear all the assets in this pile
     *
     * @function Piler.Main.BasePile#clear
     * @returns {Piler.Main.BasePile}
    ###
    clear: ->
      @assets.length = 0
      @rawPile = null
      @

    ###*
     * @function Piler.Main.BasePile#getSources
     * @returns {Promise} Return an array of strings
    ###
    getSources: ->
      sources = ([u.object()] for u in @assets when u.options.asIs is true)

      if @options.production
        sources.push ["#{ @options.urlRoot }min/#{ @pileHash }/#{ @name }.#{ @ext }"]
      else
        devCacheKey = ''

        if @options.cacheKeys
          devCacheKey = "?v=#{Date.now()}"

        for ob in @assets when ob.options.asIs is false
          sources.push ["#{ @options.urlRoot }dev/#{ @name }.#{ ob.type() }-#{ ob.id() }.#{ @ext }#{devCacheKey}", "id=\"pile-#{ ob.id() }\""]

      return sources

    ###*
     * @function Piler.Main.BasePile#findAssetBy
     * @param {String} member
     * @param {*} search
     * @returns {Promise}
    ###
    findAssetBy: (member, search) ->
      @getObjects(member).filter () ->
        (obj for obj in @assets when obj[member]() is search)[0]

    ###*
     * @function Piler.Main.BasePile#_computeHash
     * @private
     *
     * @returns {String}
    ###
    _computeHash: ->
      @pileHash = classes.Serialize.sha1(@rawPile, 'hex')

    ###*
     * Perform a compilation on the given object
    ###
    compile: (code) ->
      classes.Compilers.compile(classes.utils.extension(ob.object()), ob.object(), code.toString())

    minify: (code, options = {}) ->
      return code if not @ext

      if @options.production
        classes.Minify.minify @ext, code, classes.utils._.merge({noCache: @options.volatile}, options)
      else
        code

    ###*
     * @function Piler.Main.BasePile#pileUp
     * @param {Function} [cb]
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      self = @

      classes.utils.Q.map(@assets, (codeOb) ->

        codeOb.contents().then (code) ->
          self.commentLine("#{ codeOb.type() }: #{ codeOb.id() }") + "\n#{ code }"

      ).then(
        (result) ->
          self.rawPile = self.minify result.join("\n\n").trim()
          self._computeHash()
          self.rawPile
        (err) ->
          err
      ).nodeify(cb)

  ###*
   * @typedef {Object} Piler.Main.PileSettings
   * @property {Boolean} [cacheKeys=true]
   * @property {Boolean} [volatile=true]
   * @property {String} [urlRoot='/piler/']
   * @property {Object} [logger=console]
  ###

  class PileManager
    ###*
     * Binds an add function to an specific pile
     *
     * @function Piler.Main.PileManager#bindToPile
     * @param {String} fnName Any method name on the {@link Piler.Main.PileManager PileManager} class
     * @param {String} [namespace="__temp"] Namespace to be bound to
     * @returns {Function}
    ###
    bindToPile: (fnName, namespace = "__temp") ->
      self = @
      (data, options = {}) ->
        options = classes.utils._.defaults(options, {namespace: namespace})
        self[fnName] data, options
        return

    ###*
     * @member {Piler.Main.BasePile} Piler.Main.PileManager#type
     * @default null
    ###
    type: null

    ###*
     * @member {String} Piler.Main.PileManager#contentType
    ###
    contentType: 'text/plain'

    ###*
     * @constructor Piler.Main.PileManager
     * @param {Piler.Main.Config} [options={}]
    ###
    constructor: (@name, @options = {}) ->
      @options.urlRoot ?= '/piler/'
      @options.logger ?= classes.Logger

      @piles = {}

      @getPile "global"
      @getPile "__temp", {volatile: true}

      return

    ###*
     * Get a pile from this manager. If it doesn't exist, it will create one
     *
     * @function Piler.Main.PileManager#getPile
     * @param {String} ns
     * @param {Piler.Main.PileSettings} [settings={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    getPile: (ns, settings = {}) ->
      pile = @piles[ns]
      if not pile
        return @piles[ns] = new @type ns, settings
      pile

    ###*
     * @function Piler.Main.PileManager#_defaultArguments
     * @protected
    ###
    _defaultArguments: (options) ->
      if not options.namespace
        options.namespace = 'global'

      return

    ###*
     * Low level function that actually adds stuff to the pile, deals with
     * normalizing arguments
     *
    ###
    add: (type, data, options = {}) ->
      @_defaultArguments(options)

      debug('Adding:', type, data, options)

      pile = @getPile options.namespace
      pile["#{type}"](data, options)

    ###*
     * Add an array of files at once
     *
     * @example
     *   PileManager.addFiles(["/file/1","/file/2"])
     *
     * @function Piler.Main.PileManager#addFiles
     *
     * @param {Array} arr
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addFiles:  (arr, options) ->
      arr = classes.utils.ensureArray([], arr)

      @addFile(file, options) for file in arr
      @

    ###*
     * Add a directory
     *
     * @example
     *   PileManager.addDir(["/file/1","/file/2"])
     *
     * @function Piler.Main.PileManager#addDir
     *
     * @param {String|Array} paths You can give a glob string or an array of glob strings
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addDir:  (arr, options) ->
      arr = classes.utils.ensureArray(arr)

      @addFile(file, options) for file in arr
      @

    ###*
     * @function Piler.Main.PileManager#addFile
     * @param {String} path
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addFile: (path, options) ->
      @add("addFile", path, options)
      @

    ###*
     * @function Piler.Main.PileManager#addMultiline
     * @param {Function} path
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addMultiline: (fn, options) ->
      @add("addMultiline", fn, options)
      @

    ###*
     * @function Piler.Main.PileManager#addRaw
     * @param {String} raw
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addRaw: (raw, options) ->
      @add('addRaw', raw, options)
      @

    ###*
     * @function Piler.Main.PileManager#addUrl
     *
     * @param {String} url
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    addUrl: (url, options) ->
      @add('addUrl', url, options)
      @

    ###*
     * @function Piler.Main.PileManager#pileUp
     *
     * @param {Function} [cb] You can use a callback if you want
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      piles = @piles
      options = @options

      options.logger.notice "Generating assets for '#{ @type::ext }'"

      classes.utils.Q.map(Object.keys(piles), (name) ->
        pile = piles[name]

        pile.pileUp().then(
          (code) ->

            if options.outputDirectory
              # skip volatile piles
              return code if pile.options.volatile is true

              outputPath = classes.utils.path.join options.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

              classes.utils.fs.writeFileAsync(outputPath, code).then ->
                options.logger.info "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"
                code

            else
              code
        )
      ).nodeify(cb)

    ###*
     * @function Piler.Main.PileManager#getSources
     * @param {...*} [namespaces]
     * @returns {Promise}
    ###
    getSources: classes.utils.Q.method (namespaces...) ->
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

    wrapInTag: (data) ->
      "#{data}"

    ###*
     * @function Piler.Main.PileManager#render
     * @param {...*} [namespaces]
     * @returns {Promise} Returns the rendered tags
    ###
    render: (namespaces...) ->

      classes.utils.Q.reduce(@getSources namespaces..., (tags, source) =>
          tags += "#{@wrapInTag(source[0], source[1])}\n"
      , "")

    ###*
     * Add our version of render, we need to support promise locals
     * @function Piler.Main.PileManager#_render
     * @protected
     * @returns {Function}
    ###
    _render: (response) ->
      (name, locals, callback) ->
        if not classes.utils.isObject locals
          _locals = {}
        else
          _locals = locals

        classes.utils.Q.props(_locals).then (locals) ->
          response.render(name, locals, callback)

          locals

    ###*
     * Assign the piler namespace on the response object
     *
     * @function Piler.Main.PileManager#locals
    ###
    locals: (response) ->
      classes.utils.objectPath.ensureExists(response, 'piler', {render: @_render(response)})
      @

    ###*
     * Find an asset from a namespace
     * @returns {Promise}
    ###
    findAssetBy: classes.utils.Q.method (member, search, namespace = 'global') ->
      pile = @piles[namespace]

      throw new Error("namespace '#{namespace}' not found") if not pile

      pile.findAssetBy(member, search)

    ###*
     * Exposes a middleware for serving your assets
     *
     * @function Piler.Main.PileManager#middleware
     * @param {Object} [options={}]
     * @returns {Piler.Main.PileManager} `this`
    ###
    middleware: (options = {}) ->

      debug("setting asset serving for #{@name}")

      self = @

      (req, res, next) ->
        self.locals(res)

        if not classes.utils._.startsWith req.url, self.options.urlRoot
          return next()

        res.setHeader "Content-type", self.contentType
        asset = classes.AssetUrlParse.parse req.url

        debug('request url', req.url, 'asset', asset)

        # Wrong asset type. Lets skip to next middleware.
        if asset.ext isnt self.type::ext
          return next()

        pile = self.piles[asset.name]

        if not pile
          debug('pile not found', asset.name)

          res.send "Cannot find pile #{ asset.name }", 404
          return

        if asset.min
          if pile.options.volatile is true
            debug('prod code volatile object', asset.name, asset.ext)

            pile.pileUp().then(
              (code) ->
                res.send code
                pile.clear()
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

        pile.findAssetBy('id', asset.dev.uid).then (codeOb) ->

          if codeOb
            debug('dev code object', codeOb)

            codeOb.contents().then (code) ->
              res.end code
              return
          else
            res.send "Cannot find codeOb #{ asset.dev.uid }", 404
            res.end()

          if pile.options.volatile is true
            pile.clear()

          return

        return

  managers = {
    PileManager: PileManager
  }

  piles = {
    BasePile: BasePile
  }

  out.production = production = process.env.NODE_ENV is "production"

  out.BasePile = BasePile
  out.PileManager = PileManager

  ###*
   * @function Piler.addManager
  ###
  ###*
   * Adds a manager to Piler
   *
   * @function Piler.Main.addManager
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
  ###
  out.addManager = mainExports.addManager = (name, factoryFn) ->
    oldFn = if managers[name] then managers[name] else nul
    debug("Added manager '#{name}'")
    managers[name] = factoryFn(classes)
    oldFn

  ###*
   * @function Piler.removeManager
  ###
  ###*
   * Removes a manager from Piler
   *
   * @function Piler.Main.removeManager
   * @param {String} name Name of the manager
  ###
  out.removeManager = mainExports.removeManager = (name) ->
    delete managers[name] if managers[name]
    return

  ###*
   * @function Piler.getManager
  ###
  ###*
   * Get a manager from Piler
   *
   * @function Piler.Main.getManager
   * @param {String} name Name of the manager
  ###
  out.getManager = mainExports.getManager = (name) ->
    managers[name]

  ###*
   * @function Piler.createManager
  ###
  ###*
   * Create a new manager
   *
   * @function Piler.Main.createManager
   * @param {String} name Name of the manager
   * @param {Piler.Main.Add} name Name of the manager
  ###
  out.createManager = mainExports.createManager = (type, name, options = {}) ->
    throw new Error("Manager #{type} not available") if not managers[type]

    if classes.utils._.isObject(name)
      options = name
      name = null

    new managers[type](name, options)

  ###*
   * @function Piler.addPile
  ###
  ###*
   * Adds a pile to Piler
   *
   * @function Piler.Main.addPile
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
  ###
  out.addPile = mainExports.addPile = (name, factoryFn) ->
    oldFn = if piles[name] then piles[name] else ->
    debug("Added pile '#{name}'")
    piles[name] = factoryFn(classes)
    oldFn

  ###*
   * @function Piler.getPile
  ###
  ###*
   * Get a pile from Piler
   *
   * @function Piler.Main.getPile
   * @param {String} name
   * @param {Piler.FactoryFn} factoryFn
  ###
  out.getPile = mainExports.getPile = (name) ->
    piles[name]

  ###*
   * @function Piler.removePile
  ###
  ###*
   * Removes a pile from Piler
   *
   * @function Piler.Main.removePile
   * @param {String} name Name of the pile
  ###
  out.removePile = mainExports.removePile = (name) ->
    delete piles[name] if piles[name]
    return

  out

