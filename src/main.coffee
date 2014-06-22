module.exports = (Piler, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Main
  ###

  op = Piler.utils.objectPath

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Main}
     * @function Piler.Main.debug
    ###
    debug: debug = Piler.utils.debug("piler:main")
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

      Piler.utils._.defaults(@options, {
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
     * @returns {Promise}
    ###
    add: (config) ->
      throw new Error('add expects an object as parameter') if not Piler.utils._.isObject(config)

      op.ensureExists(config, 'options', {})

      config.options = Piler.utils._.defaults(config.options, {
        filePath: false
        asIs: false
        noSumContent: false
        before: false
      })

      type = if not config.options.before then 'push' else 'unshift'

      @assets[type] object = Piler.Serialize.serialize.call
        type: config.type
        object: config.object
        options: config.options

      Piler.utils.Q.resolve(object)

    ###*
     * Permanently remove an asset from this pile
     * @function Piler.Main.BasePile#remove
    ###
    remove: (obj) ->
      index = -1
      for asset in @assets
        index++
        if asset is obj
          break

      if index > -1
        Piler.utils.objectPath.del(@assets, [index])

      return

    duplicated: (type, content) ->
      @filterObjects(type, 'toString').then (items) =>
        content = Piler.Serialize.stringify(content)
        throw new Error('Duplicated item') if content in items
        items

    ###*
     * Adds a multiline that will be converted to a string later (or can be compiled to any code)
     *
     * @function Piler.Main.BasePile#addMultiline
     * @returns {Promise}
    ###
    addMultiline: (fn, options = {}) ->
      @duplicated('multiline', fn).then(
        =>
          @add({type: "multiline", object: fn, options})
      )

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
      filePath = Piler.utils.path.normalize filePath

      @duplicated('file', filePath).then(
        =>
          options = Piler.utils._.defaults(options, {noSumContent: true, filePath: true})
          @add({type: "file", object: filePath, options})
      )

    ###*
     * @function  Piler.Main.BasePile#addUrl
     * @param {String} url
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Promise} `this`
    ###
    addUrl: (url, options = {}) ->
      @duplicated('url', url).then(
        =>
          options = Piler.utils._.defaults(options, {asIs: true})
          @add({type: 'url', object: url, options})
      )

    ###*
     * @function Piler.Main.BasePile#addRaw
     * @param {*} raw
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    addRaw: (raw, options = {}) ->
      @duplicated('raw', raw).then(
        =>
          @add({type: "raw", object: raw, options})
      )

    ###*
     * @function Piler.Main.BasePile#filterObjects
     *
     * @returns {Promise} The result of the promise will be an array
    ###
    filterObjects: (filter, member = 'object') ->
      if filter and member
        Piler.utils.Q.all (ob[member]() for ob in @assets when ob.type() is filter)
      else if member
        Piler.utils.Q.all (ob[member]() for ob in @assets)
      else
        Piler.utils.Q.all (ob for ob in @assets)

    ###*
     * Clear all the assets in this pile
     *
     * @function Piler.Main.BasePile#clear
     * @returns {Piler.Main.BasePile}
    ###
    clear: ->
      @assets.length = 0
      @rawPile = null
      @pileHash = ''
      @

    ###*
     * @function Piler.Main.BasePile#getSources
     * @returns {Promise} Return an array of strings
    ###
    getSources: ->
      sources = ([u.object(), u.options.extra] for u in @assets when u.options.asIs is true)

      if @options.volatile
        for ob in @assets when ob.options.asIs is false
          sources.push [
            "#{ @options.urlRoot }temp/#{ @name }.#{ ob.type() }-#{ ob.id() }.#{ @ext }"
            ob.options.extra
          ]
      else
        if @options.production
          sources.push ["#{ @options.urlRoot }min/#{@pileHash}/#{ @name }.#{ @ext }"]
        else
          devCacheKey = ''

          if @options.cacheKeys
            devCacheKey = "?v=#{Date.now()}"

          for ob in @assets when ob.options.asIs is false
            sources.push [
              "#{ @options.urlRoot }dev/#{ @name }.#{ ob.type() }-#{ ob.id() }.#{ @ext }#{devCacheKey}"
              Piler.utils._.merge({}, ob.options.extra, {id: "pile-#{ ob.id() }"})
            ]

      sources

    ###*
     * @function Piler.Main.BasePile#findAssetBy
     * @param {String} member
     * @param {*} search
     * @param {*} one Return the first item found
     * @returns {Promise} Array of values or single value
    ###
    findAssetBy: (member, search, one = true) ->
      reduced = Piler.utils.Q.reduce(
        (asset for asset in @assets)
        (total, asset) ->
          Piler.utils.Q.try(->
            asset[member]()
          ).then((value)->
            if value is search
              total.push asset
          ).then(->
            total
          )
        []
      )

      if one
        reduced.then (values) ->
          values[0]
      else
        reduced

    ###*
     * @function Piler.Main.BasePile#_computeHash
     * @private
     *
     * @returns {String}
    ###
    _computeHash: ->
      @pileHash = Piler.Serialize.sha1(@rawPile, 'hex')

    ###*
     * Perform a compilation on the given object
    ###
    compile: (code) ->
      return code
      Piler.Compilers.compile(Piler.utils.extension(ob.object()), ob.object(), code.toString())

    ###*
     * Perform a minification on the given object
    ###
    minify: (code, options = {}) ->
      return code
      return code if not @ext

      if @options.production
        Piler.Minifiers.minify @ext, code, Piler.utils._.merge({noCache: @options.volatile}, options)
      else
        code

    ###*
     * @function Piler.Main.BasePile#pileUp
     * @param {Function} [cb]
     * @returns {Promise}
    ###
    pileUp: (cb) ->
      self = @

      Piler.utils.Q.map(@assets, (codeOb) ->

        codeOb.contents().then (code) ->
          "#{self.commentLine("#{ self.name }.#{ codeOb.type() }-#{ codeOb.id() }.#{self.ext}")}\n#{ code }"

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
     * @param {String|Boolean} [namespace=true] Namespace to be bound to. If sets to true, will create a random volatile pile
     * @returns {Function}
    ###
    bindToPile: (fnName, namespace = true) ->
      self = @
      (data, options = {}) ->
        defaults = {namespace: namespace}

        if namespace is true
          namespace = self.createTempNamespace()
          defaults.namespace = namespace

        options = Piler.utils._.defaults(options, defaults)
        self[fnName] data, options

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
      @options.logger ?= Piler.Logger

      @piles = {}

      @getPile "global"

      return

    ###*
     * Add assets in order
     * @param {Array} arr Array containing an array of ["command", "content", "options"]
     * @returns {Promise}
    ###
    batch: (arr) ->
      arr = Piler.utils.ensureArray(arr)
      Piler.utils.Q.reduce(
        arr
        (total, value) =>
          @[value[0]](value[1], value[2]).then((val)->
            total.concat val
          )
        []
      )

    ###*
     * Disposes a namespace, clear it and remove from this manager
     * @param {...String} namespaces Namespaces names
     * @function Piler.Main.PileManager#dispose
    ###
    dispose: (namespaces...) ->
      for namespace in namespaces when namespace isnt 'global'
        if (pile = @piles[namespace])
          pile.clear()
          delete @piles[namespace]

      return

    createTempNamespace: ->
      namespace = "temp-#{Date.now().toString() + Math.random().toString().replace('.','~')}"
      @getPile(namespace, {volatile: true})
      debug('Created random volatile pile', @type::ext, namespace)
      namespace

    ###*
     * Get a pile from this manager. If it doesn't exist, it will create one
     *
     * @function Piler.Main.PileManager#getPile
     * @param {String} namespace
     * @param {Piler.Main.PileSettings} [settings={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    getPile: (namespace, settings = {}) ->
      pile = @piles[namespace]
      if not pile
        return @piles[namespace] = new @type namespace, Piler.utils._.merge({}, @options, settings)
      pile

    ###*
     * @function Piler.Main.PileManager#_defaultOptions
     * @protected
    ###
    _defaultOptions: (options) ->
      if not options.namespace
        options.namespace = 'global'

      return

    ###*
     * Low level function that actually adds stuff to the pile, deals with
     * normalizing options
     * @function Piler.Main.PileManager#add
     * @param {String} type BasePile method name
     * @param {*} data Any type of data that should be piled
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Promise}
    ###
    add: (type, data, options = {}) ->
      @_defaultOptions(options)

      debug('Adding:', type, data, options)

      pile = @getPile options.namespace
      pile["#{type}"](data, options).then((value) =>
        pile.pileUp().then(->
          value
        )
      )

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
     * @returns {Promise}
    ###
    addFiles:  (arr, options) ->
      arr = Piler.utils.ensureArray(arr)

      Piler.utils.Q.all (@addFile(file, options) for file in arr)

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
     * @returns {Promise}
    ###
    addDir:  (arr, options) ->
      arr = Piler.utils.ensureArray(arr)

      Piler.utils.Q.all (@addFile(file, options) for file in arr)

    ###*
     * @function Piler.Main.PileManager#addFile
     * @param {String} path
     * @param {Object} [options={}]
     * @returns {Promise}
    ###
    addFile: (path, options) ->
      @add("addFile", path, options)

    ###*
     * @function Piler.Main.PileManager#addMultiline
     * @param {Function} path
     * @param {Object} [options={}]
     * @returns {Promise}
    ###
    addMultiline: (fn, options) ->
      @add("addMultiline", fn, options)

    ###*
     * @function Piler.Main.PileManager#addRaw
     * @param {String} raw
     * @param {Object} [options={}]
     * @returns {Promise}
    ###
    addRaw: (raw, options) ->
      @add('addRaw', raw, options)

    ###*
     * @function Piler.Main.PileManager#addUrl
     *
     * @param {String} url
     * @param {Object} [options={}]
     * @returns {Promise}
    ###
    addUrl: (url, options) ->
      @add('addUrl', url, options)

    ###*
     * Update all related piles and assets and save them to disk, if you set outputDirectory
     *
     * @function Piler.Main.PileManager#contents
     *
     * @param {Function} [cb] You can use a callback if you want
     * @returns {Promise} The current array of all content
    ###
    contents: (cb) ->
      piles = @piles
      options = @options

      Piler.utils.Q.reduce(
        Object.keys(piles)
        (total, name) =>
          pile = piles[name]

          options.logger.notice "Generating assets for '#{ pile.name }' in '#{ pile.ext }'"

          pile.pileUp().then(
            (code) ->

              if options.outputDirectory
                # skip volatile piles
                return total.concat(code) if pile.options.volatile is true

                outputPath = Piler.utils.path.join options.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

                Piler.utils.fs.writeFileAsync(outputPath, code).then ->
                  options.logger.info "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"
                  total.concat(code)

              else
                total.concat(code)
          )
        []
      ).nodeify(cb)


    _prepareNamespaces: (namespaces) ->
      if typeof Piler.utils._.last(namespaces) is "object"
        opts = namespaces.pop()
      else
        opts = {}

      if not opts.disableGlobal
        namespaces.unshift "global"

      if not opts.disableVolatile
        for namespace,pile of @piles when pile.options.volatile is true
          namespaces.push namespace

      namespaces

    ###*
     * @function Piler.Main.PileManager#getSources
     * @param {...*} [namespaces]
     * @returns {Promise}
    ###
    getSources: (namespaces...) ->
      @_prepareNamespaces(namespaces)

      sources = []

      for ns in namespaces
        if (pile = @piles[ns])
          sources.push pile.getSources()...

      sources

    _objectToAttr: (obj)->
      if Piler.utils._.isArray(obj)
        obj.join(' ')
      else if obj
        code = []

        for k of obj
          code.push "#{k}=#{Piler.Serialize.stringify obj[k]}"

        code.join(' ')
      else
        ''

    wrapInTag: (data) ->
      "#{data}"

    ###*
     * @function Piler.Main.PileManager#render
     * @param {...*} [namespaces]
     * @returns {Promise} Returns the rendered tags
    ###
    render: (namespaces...) ->

      Piler.utils.Q.reduce(@getSources(namespaces...), (tags, source) =>
        tags += "#{@wrapInTag(source[0], @_objectToAttr(source[1]))}\n"
      , "")

    ###*
     * Add our version of render, we need to support promise locals
     *
     * @function Piler.Main.PileManager#_render
     * @protected
     * @returns {Function}
    ###
    _render: (response) ->
      (name, locals, callback) ->
        if not Piler.utils._.isObject locals
          _locals = {}
        else
          _locals = locals

        Piler.utils.Q.props(_locals).then (locals) ->
          response.render(name, locals, callback)

          locals

    ###*
     * Assign the piler namespace on the response object
     *
     * @function Piler.Main.PileManager#locals
    ###
    locals: (response) ->
      Piler.utils.objectPath.ensureExists(response, 'piler', {render: @_render(response)})
      @

    ###*
     * Stream the contents of the piles in this manager
     * @function Piler.Main.PileManager#stream
     * @returns {Stream}
    ###
    stream: (namespaces...) ->
      stream = Piler.utils.through()
      main = Piler.utils.Q.resolve()
      promises = (@piles[namespace].pileUp() for namespace in namespaces when @piles[namespace])

      if promises.length
        for promise in promises
          main = main.then(promise).then((value)->
            stream.write(value)
          )

        main.done(->
          stream.end()
        )
      else
        stream.end()

      stream

    ###*
     * Find an asset from a namespace
     * @returns {Promise}
    ###
    findAssetBy: Piler.utils.Q.method (member, search, namespace = 'global') ->
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
        return next() if not req

        self.locals(res)

        if not Piler.utils._.startsWith req.url, self.options.urlRoot
          return next()

        asset = Piler.AssetUrlParse.parse req.url

        if not asset
          debug('not an asset, skipping', req.url)
          return next()

        debug('request url', req.url, 'asset', asset)

        # Wrong asset type. Lets skip to next middleware.
        if asset.ext isnt self.type::ext
          return next()

        res.setHeader "Content-Type", self.contentType

        pile = self.piles[asset.name]

        if not pile
          debug('pile not found', asset.name)

          res.send "Cannot find pile #{ asset.name }", 404
          return

        if asset.min
          res.setHeader('Cache-Control', 'max-age=31556900')
          res.send pile.rawPile
          res.end()

          return

        return next() if not asset.dev and not asset.temp

        uid = if asset.temp then asset.temp.uid else asset.dev.uid

        pile.findAssetBy('id', uid).then (codeOb) ->

          if codeOb
            debug('code object', codeOb.id())

            codeOb.contents().then (code) ->
              res.end code
              return
          else
            res.send "Cannot find codeOb #{ uid }", 404
            res.end()

          if pile.options.volatile is true
            pile.remove(codeOb)

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
    oldFn = if managers[name] then managers[name] else null
    debug("Added manager '#{name}'")
    managers[name] = factoryFn(Piler)
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

    if Piler.utils._.isObject(name)
      options = name
      name = null

    if not name
      name = type

    Piler.utils.objectPath.ensureExists(options, 'production', production)

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
    piles[name] = factoryFn(Piler)
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

