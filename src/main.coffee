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
    debug: debug = Piler.utils.debug('piler:main')
    defaults: (options) ->
      Piler.utils._.defaults(options, {
        cacheKeys: true
        volatile: false
        logger: Piler.Logger
        urlRoot: '/piler/'
        env: 'development'
        commentLines: true
      })

  }

  ###*
   * Config object for each processor
   *
   * @example
   *   {
   *     'coffeescript':{},
   *     'csso':{}
   *   }
   * @typedef {Object.<String, Object>} Piler.Main.ProcessorsConfig
  ###

  ###*
   * Automated processors for the current pile
   *
   * @typedef {Piler.Main.ProcessorsConfig} Piler.Main.BasePile#processors
  ###

  ###*
   * Config object for {@link Piler.Main.BasePile#add BasePile#add}
   *
   * @typedef {Object} Piler.Main.AddConfig
   * @property {String} type Type assigned by {@link Piler.Serialize.addSerializable addSerializable}
   * @property {*} raw Any content
   * @property {Piler.Serialize.CodeObjectOptions} [options] Assign any options to this object
  ###

  class BasePile
    ###*
     * @member {Piler.Main.Processors} Piler.Main.BasePile#processors
     * @default null
    ###
    processors: null

    ###*
     * @constructor Piler.Main.BasePile
     *
     * @param {String} name
     * @param {Piler.Main.PileSettings} [options={}]
    ###
    constructor: (@name, @options = {}) ->
      @assets = []
      @rawPile = null
      @pileHash = ''

      out.defaults(@options)

      return

    ###*
     * All add* calls ends here. Add an asset and mutate extend the passed
     * configuration with mixins from {@link Piler.Serialize.CodeObject CodeObject}
     *
     * @function Piler.Main.BasePile#add
     * @param {Piler.Main.AddConfig} config
     * @returns {Piler.Serialize.CodeObject}
    ###
    add: (config) ->
      throw new Error('add expects an object as parameter') if not Piler.utils._.isObject(config)

      op.ensureExists(config, 'options', {
        env: @options.env
      })

      type = if not config.options.before then 'push' else 'unshift'

      @assets[type](
        object = Piler.Serialize.serialize.call({
          type: config.type
          raw: config.object
          options: config.options
        })
      )
      object

    ###*
     * Permanently remove an asset from this pile
     *
     * @function Piler.Main.BasePile#remove
     * @param {Piler.Serialize.CodeObject} obj
    ###
    remove: (obj) ->
      index = -1
      for asset in @assets
        index++
        if asset is obj
          break

      if index > -1
        op.del(@assets, [index])

      return

    ###*
     * Check for duplicated asset
     *
     * @function Piler.Main.BasePile#duplicated
     * @param {String} type Any type added by {@link Piler.Serializable.addSerializable addSerializable}
     * @param {*} content Content to be checked against
     *
     * @returns {Boolean}
    ###
    duplicated: (type, content) ->
      content = Piler.Serialize.stringify(content)

      for asset in @assets when asset.type() is type
        if asset.toString() is content
          return true

      false

    ###*
     * Adds a multiline that will be converted to a string later (or can be compiled to any code)
     *
     * @function Piler.Main.BasePile#addMultiline
     * @param {Function} fn
     * @param {Object} [options={}]
     *
     * @returns {Piler.Main.BasePile} `this`
    ###
    addMultiline: (fn, options) ->
      if not @duplicated('multiline', fn)
        @add({type: 'multiline', object: fn, options})

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
    addFile: (filePath, options) ->
      filePath = Piler.utils.path.normalize(filePath)

      if not @duplicated('file', filePath)
        options = Piler.utils._.defaults(options, {hashFrom: 'options.filePath', filePath: filePath})
        @add({type: 'file', object: filePath, options})

      @

    ###*
     * Adds a URL, can be external, complete (with protocols) or relative to the current page
     *
     * @example
     *   Pile.addUrl('/remote.js');
     *
     * @function Piler.Main.BasePile#addUrl
     * @param {String} url
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    addUrl: (url, options) ->
      if not @duplicated('url', url)
        options = Piler.utils._.defaults(options, {asIs: true})
        @add({type: 'url', object: url, options})

      @

    ###*
     * Add raw string or object. This will rely on the options
     *
     * @function Piler.Main.BasePile#addRaw
     * @param {*} raw
     * @param {Piler.Main.AddConfig} [options={}]
     * @returns {Piler.Main.BasePile} `this`
    ###
    addRaw: (raw, options) ->
      if not @duplicated('raw', raw)
        @add({type: 'raw', object: raw, options})

      @

    ###*
     * Get or filter assets on this pile
     *
     * @function Piler.Main.BasePile#getObjects
     *
     * @example
     *   // get all objects contents of all types
     *   Pile.getObjects(null, 'contents').done(function(contentsArray){
     *     // contentsArray is the contents of all assets in the pile
     *   });
     *   // get all types of 'file'
     *   Pile.getObjects('file', null, function(objectArray){
     *     // objectArray is all objects are that of type 'file'
     *   });
     *   // get all objects
     *   Pile.getObjects().then(function(objectArray){
     *     // objectArray is all objects are that of type 'file'
     *   });
     *
     * @param {String} [type] Filter by type
     * @param {String|Array} [member='raw'] Member of the object. May use a map string, like `'options.name'` or an array
     * @param {Piler.NodeCallback} [cb]
     *
     * @returns {Promise} `this` The result of the promise will be an array
    ###
    getObjects: (type, member = 'raw', cb) ->
      filterFn = (ob) ->
        fn = op.get(ob, [member].join('.'))
        if Piler.utils._.isFunction(fn)
          fn()
        else
          fn

      promises = []

      if type and member
        for ob in @assets when ob.type() is type
          f = filterFn(ob)
          if f isnt undefined
            promises.push(f)
      else if member
        for ob in @assets
          f = filterFn(ob)
          if f isnt undefined
            promises.push(f)
      else if type
        for ob in @assets when ob.type() is type
          promises.push(ob)
      else
        promises.push.apply((ob for ob in @assets))

      Piler.utils.Promise.all(promises).bind(@).nodeify(cb)

    ###*
     * Clear all the assets in this pile
     *
     * @function Piler.Main.BasePile#clear
     *
     * @returns {Piler.Main.BasePile}
    ###
    clear: ->
      @assets.length = 0
      @rawPile = null
      @pileHash = ''
      @

    ###*
     * @function Piler.Main.BasePile#getSources
     * @returns {Array} Return an array of strings
    ###
    getSources: ->
      sources = ([u.raw(), u.options.extra] for u in @assets when u.options.asIs is true)

      if @options.volatile
        for ob in @assets when ob.options.asIs is false
          sources.push([
            "#{ @options.urlRoot }temp/#{ @name }.#{ ob.type() }-#{ ob.id() }.#{ @ext }"
            ob.options.extra
          ])
      else
        if @options.env is 'production'
          sources.push(["#{ @options.urlRoot }min/#{@pileHash}/#{ @name }.#{ @ext }"])
        else
          devCacheKey = ''

          if @options.cacheKeys
            devCacheKey = "?v=#{Date.now()}"

          for ob in @assets when ob.options.asIs is false
            sources.push([
              "#{ @options.urlRoot }dev/#{ @name }.#{ ob.type() }-#{ ob.id() }.#{ @ext }#{devCacheKey}"
              Piler.utils._.merge({}, ob.options.extra, {id: "pile-#{ ob.id() }"})
            ])

      sources

    ###*
     * Find an asset by any member of {@link Piler.Serialize.CodeObject CodeObject}
     *
     * @example
     *  PM.findAssetBy('id', '9a810daff', false, function(err, asset){
     *     // asset.contents()
     *  })
     *  // or using promises
     *  PM.findAssetBy('id', '9a810daff', false).then(function(asset){
     *     // asset.contents()
     *  }, function(err){
     *     // failed
     *  });
     *
     * @function Piler.Main.BasePile#findAssetBy
     *
     * @param {String} member
     * @param {*} search
     * @param {Boolean} [one=true] Return the first item found
     * @param {Piler.NodeCallback} [cb] Callback if you don't want to use promises
     * @returns {Promise} `this` Array of values or single value
    ###
    findAssetBy: (member, search, one = true, cb) ->
      member = [member].join('.')

      reduced = Piler.utils.Promise.reduce(
        (asset for asset in @assets)
        (total, asset) ->
          Piler.utils.Promise.try(->
            fn = op.get(asset, [member])

            if typeof fn is 'function'
              fn.call(asset)
            else
              fn
          ).then((value)->
            if value is search
              total.push(asset)
          ).then(->
            total
          )
        []
      )

      if one
        reduced = reduced.then((values) ->
          values[0]
        )

      reduced.bind(@).nodeify(cb)

    ###*
     * Set the pileHash from the concatenated result from pileUp
     *
     * @function Piler.Main.BasePile#_computeHash
     * @private
     *
     * @returns {String}
    ###
    _computeHash: ->
      @pileHash = Piler.Serialize.sha1(@rawPile, 'hex')

    ###*
     * Returns the sum of all assets in this pile
     *
     * @function Piler.Main.BasePile#pileUp
     * @param {Piler.NodeCallback} [cb] Callback instead of using the promise
     * @returns {Promise} `this`
    ###
    pileUp: (cb) ->
      self = @

      Piler.utils.Promise.map(@assets, (codeOb) ->
        if codeOb.options.asIs
          return ''

        codeOb.contents().then((code) ->
          """
            #{if self.options.commentLines then self.commentLine("#{ self.name }.#{ codeOb.type() }-#{ codeOb.id() }.#{self.ext}") else ''}
            #{ code }
          """
        )

      ).then(
        (result) ->
          #Piler.Processors.process 'post',
          self.rawPile = result.join('\n\n').trim()
          self._computeHash()
          self.rawPile
        (err) ->
          err
      ).bind(@).nodeify(cb)

  ###*
   * Config object for {@link Piler.Main.BasePile BasePile} and {@link Piler.Main.PileManager PileManager}
   *
   * @typedef {Object} Piler.Main.PileSettings
   * @property {Boolean} [cacheKeys=true] When true, adds ?v=xxxxxxx query string to
   * @property {Boolean} [volatile=false] Setting a pile to volatile means that everytime an asset is served, it's removed from the pile
   * @property {String} [urlRoot='/piler/"] The middleware URI root, like `/piler/min/...`
   * @property {Object} [logger=console] By default, the logger is the console
   * @property {String} [env='development'] Environment this pile works on, it affects processors directly
   * @property {Boolean} [commentLines=true] When set to true, the ID of the pile is appended to the asset, so you can easily find it in your code.
  ###

  class PileManager
    ###*
     * Binds an add function to an specific pile
     *
     * @example
     *  var addSingularity = js.bindToPile('addSingularity', 'global')
     *  js.addSingularity = function(doh){
     *    return this.add({type: 'singularity', raw: doh});
     *  };
     *  // will always point to js manager to the global pile, regardless when or where it's called
     *  addSingularity('doh');
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
        self[fnName](data, options)

    ###*
     * @member {Piler.Main.BasePile} Piler.Main.PileManager#type
     * @default null
    ###
    type: null

    ###*
     * @member {String} Piler.Main.PileManager#contentType
     * @default 'text/plain'
    ###
    contentType: 'text/plain'

    ###*
     * Manager that holds many pile namespaces at once, and serve assets through
     * middleware
     *
     * @constructor Piler.Main.PileManager
     * @param {Piler.Main.PileSettings} [options={}]
    ###
    constructor: (@name, @options = {}) ->
      out.defaults(@options)

      @piles = {}

      @getPile('global')

      return

    ###*
     * Add assets in order
     *
     * @function Piler.Main.PileManager#batch
     * @param {Array} arr Array containing an array of ["command", "content", "options"]
     *
     * @returns {Piler.Main.PileManager} `this`
    ###
    batch: (arr) ->
      arr = Piler.utils.ensureArray(arr)

      for value in arr
        @[value[0]](value[1], value[2])

      @

    ###*
     * Disposes a namespace, clear it and remove from this manager
     *
     * @param {...String} namespaces Namespaces names
     * @function Piler.Main.PileManager#dispose
     * @returns {Piler.Main.PileManager} `this`
    ###
    dispose: (namespaces) ->
      namespaces = Piler.utils.ensureArray(namespaces)

      for namespace in namespaces
        if (pile = @piles[namespace])
          pile.clear()
          delete @piles[namespace]

      @

    ###*
     * Create a volatile randomly named namespace
     *
     * @function Piler.Main.PileManager#createTempNamespace
     * @returns {String}
    ###
    createTempNamespace: ->
      namespace = "temp+#{@type::ext}-#{Piler.Serialize.sha1(Date.now().toString() + Math.random().toString().replace('.','~'),'hex').substr(0, 12)}"
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
        return @piles[namespace] = new @type(namespace, Piler.utils._.merge({}, @options, settings))
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
     * @param {Piler.NodeCallback} [cb] Use a callback instead
     * @returns {Piler.Serialize.CodeObject}
    ###
    add: (type, data, options = {}, cb) ->
      @_defaultOptions(options)

      debug('Adding:', type, data, options)

      pile = @getPile(options.namespace)
      obj = pile["#{type}"](data, options)
      pile.pileUp(cb)

      obj

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
      arr = Piler.utils.ensureArray(arr)

      (@addFile(file, options) for file in arr)

      @

    ###*
     * Add a match of files
     *
     * @example
     *   PileManager.addWildcard(["/folder/*.js","/folder2/*.js"])
     *
     * @function Piler.Main.PileManager#addWildcard
     *
     * @param {String|Array} paths You can give a glob string or an array of glob strings
     * @param {Object} [options={}]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Promise}
    ###
    addWildcard:  (arr, options, cb) ->
      arr = Piler.utils.ensureArray(arr)

      promises = []

      for file in arr
        promises.push(do (file) ->

          new Piler.utils.Promise(
            (resolve, reject) ->
              Piler.utils.glob(file, {cwd: Piler.utils.path.dirname(file)}, (err, matches)->
                if err
                  reject(aerr)
                else
                  resolve(matches)
                return
              )
              return
          )
        )


      Piler.utils.Promise.map(
        promises
        (value) =>
          @addFiles(value, options)
      ).bind(@).nodeify(cb)


    ###*
     * @function Piler.Main.PileManager#addFile
     * @param {String} path
     * @param {Object} [options={}]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Piler.Serialize.CodeObject}
    ###
    addFile: (path, options, cb) ->
      @add('addFile', path, options, cb)
      @

    ###*
     * @function Piler.Main.PileManager#addMultiline
     * @param {Function} path
     * @param {Object} [options={}]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Piler.Serialize.CodeObject}
    ###
    addMultiline: (fn, options, cb) ->
      @add('addMultiline', fn, options, cb)
      @

    ###*
     * @function Piler.Main.PileManager#addRaw
     * @param {String} raw
     * @param {Object} [options={}]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Piler.Serialize.CodeObject}
    ###
    addRaw: (raw, options, cb) ->
      @add('addRaw', raw, options, cb)
      @

    ###*
     * @function Piler.Main.PileManager#addUrl
     *
     * @param {String} url
     * @param {Object} [options={}]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Piler.Serialize.CodeObject}
    ###
    addUrl: (url, options, cb) ->
      @add('addUrl', url, options, cb)
      @

    ###*
     * Update all related piles and assets and if this pile has set outputDirectory save, them to disk.
     *
     * @function Piler.Main.PileManager#contents
     *
     * @param {Piler.NodeCallback} [cb] You can use a callback if you want
     * @returns {Promise} The current array of all content
    ###
    contents: (cb) ->
      piles = @piles
      options = @options

      Piler.utils.Promise.reduce(
        Object.keys(piles)
        (total, name) ->
          pile = piles[name]

          options.logger.notice("Generating assets for '#{ pile.name }' in '#{ pile.ext }'")

          pile.pileUp().then(
            (code) ->

              if options.outputDirectory
                # skip volatile piles
                return total.concat(code) if pile.options.volatile is true

                outputPath = Piler.utils.path.join(options.outputDirectory, "#{ pile.name }.#{ pile.ext }")

                Piler.utils.fs.writeFileAsync(outputPath, code).then(->
                  options.logger.info("Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }")
                  total.concat(code)
                )
              else
                total.concat(code)
          )
        []
      ).bind(@).nodeify(cb)

    ###*
     * @function Piler.Main.PileManager#_prepareNamespaces
     *
     * @param {Array} [namespaces=["global"]]
     * @param {Object} [opts={}]
     * @private
    ###
    _prepareNamespaces: (namespaces, opts={}) ->
      namespaces = Piler.utils.ensureArray(namespaces)

      if not opts.disableGlobal
        namespaces.unshift('global')

      if not opts.disableVolatile
        for namespace,pile of @piles when pile.options.volatile is true
          namespaces.push(namespace)

      namespaces

    ###*
     * @function Piler.Main.PileManager#getSources
     * @param {Array} [namespaces=["global"]]
     * @returns {Array}
    ###
    getSources: (namespaces) ->
      namespaces = @_prepareNamespaces(namespaces)

      sources = []

      for ns in namespaces
        if (pile = @piles[ns])
          sources.push(pile.getSources()...)

      sources

    ###*
     * Convert an object to `attribute="value"` for HTML tags
     *
     * @function Piler.Main.PileManager#_objectToAttr
     * @private
     * @returns {String}
    ###
    _objectToAttr: (obj)->
      if Piler.utils._.isArray(obj)
        obj.join(' ')
      else if obj
        code = []

        for k of obj
          code.push("#{k}=#{Piler.Serialize.stringify(obj[k])}")

        code.join(' ')
      else
        ''

    ###*
     * When {@link Piler.Main.PileManager#render render} is called, each content calls this function
     *
     * @param {String} code The code itself
     * @param {*} [extra] Any extra information passed to the tag
    ###
    wrapInTag: (code) ->
      "#{code}"

    ###*
     * @function Piler.Main.PileManager#render
     * @param {Array.<String>} [namespaces]
     * @param {Piler.NodeCallback} [cb]
     * @returns {Promise} Returns the rendered tags
    ###
    render: (namespaces, cb) ->
      namespaces = Piler.utils.ensureArray(namespaces)

      Piler.utils.Promise.reduce(
        @getSources(namespaces)
        (tags, source) =>
          tags += "#{@wrapInTag(source[0], @_objectToAttr(source[1]))}\n"
        ''
      ).bind(@).nodeify(cb)

    ###*
     * Add our version of render, we need to support promise locals
     *
     * @function Piler.Main.PileManager#_render
     * @protected
     * @returns {Function}
    ###
    _render: (response) ->
      (name, locals, callback) ->
        if not Piler.utils._.isObject(locals)
          _locals = {}
        else
          _locals = locals

        Piler.utils.Promise.props(_locals).then((locals) ->
          response.render(name, locals, callback)

          locals
        )

    ###*
     * Assign the piler namespace on the response object
     *
     * @function Piler.Main.PileManager#locals
    ###
    locals: (response) ->
      op.ensureExists(response, 'piler', {render: @_render(response)})
      @

    ###*
     * Stream the contents of the piles in this manager
     * @function Piler.Main.PileManager#stream
     * @param {Array} namespaces
     * @param {Object} [options] Pass options to the {@link Piler.Main.PilerManager#_prepareNamespaces _prepareNamespaces} function
     * @returns {Stream}
    ###
    stream: (namespaces, options) ->
      namespaces = @_prepareNamespaces(namespaces, options)

      pm = @

      main = Piler.utils.Promise.resolve()

      promises = (pm.piles[namespace].pileUp() for namespace in namespaces when pm.piles[namespace])

      Piler.utils.through(
        (chunk, enc, callback) ->
          if promises.length
            for promise in promises
              main = main.then(promise).then((value) =>
                @push(value)
                return
              )

            main.finally(->
              callback()
              return
            )
          else
            callback()

          return
      )

    ###*
     * Find an asset from a namespace
     * @function Piler.Main.PileManager#findAssetsBy
     * @param {String} member
     * @param {*} search
     * @param {String} [namespace='global']
     * @param {Piler.NodeCallback} [cb]
     * @returns {Promise}
    ###
    findAssetsBy: (member, search, namespace = 'global', cb) ->
      pile = @piles[namespace]

      if not pile
        promise = Piler.utils.Promise.reject("namespace '#{namespace}' not found")
      else
        promise = pile.findAssetBy(member, search, false)

      promise.bind(@).nodeify(cb)

    ###*
     * Exposes a middleware for serving your assets
     *
     * @function Piler.Main.PileManager#middleware
     * @param {Object} [options={}]
     *
     * @returns {Function}
    ###
    middleware: (options = {}) ->

      debug("setting asset serving for #{@name}")

      self = @

      (req, res, next) ->
        return next() if not req

        self.locals(res)

        if not Piler.utils._.startsWith(req.url, self.options.urlRoot)
          return next()

        asset = Piler.AssetUrlParse.parse(req.url)

        if not asset or Piler.utils._.isEmpty(asset)
          debug('not an asset, skipping', req.url)
          return next()

        debug('request url', req.url, 'asset', asset)

        # Wrong asset type. Lets skip to next middleware.
        if asset.ext isnt self.type::ext
          return next()

        res.setHeader('Content-Type', self.contentType)

        pile = self.piles[asset.name]

        if not pile
          debug('pile not found', asset.name)

          res.send(404, "Cannot find pile #{ asset.name }")
          res.end()

          return

        if asset.min
          res.setHeader('Cache-Control', 'max-age=31556900')
          res.send(pile.rawPile)
          res.end()

          return

        return next() if not asset.dev and not asset.temp

        uid = if asset.temp then asset.temp.uid else asset.dev.uid

        pile.findAssetBy('id', uid).then((codeOb) ->
          if codeOb
            debug('code object', codeOb.id())

            codeOb.contents().then((code) ->
              res.end(code)
              return
            )
          else
            res.send(404, "Cannot find codeOb #{ uid }")
            res.end()

          if pile.options.volatile is true
            pile.remove(codeOb)

          return
        )

        return

  managers = {
    PileManager: PileManager
  }

  piles = {
    BasePile: BasePile
  }

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
   * @returns {Piler.Main.PileManager|null}
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
   * @returns {Piler.Main.PileManager}
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
   *
   * @returns {Piler.Main.PileManager}
  ###
  out.createManager = mainExports.createManager = (type, name, options = {}) ->
    throw new Error("Manager #{type} not available") if not managers[type]

    if Piler.utils._.isObject(name)
      options = name
      name = null

    if not name
      name = type

    op.ensureExists(options, 'env', process.env.NODE_ENV or 'development')

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
   *
   * @returns {Piler.Main.BasePile|null}
  ###
  out.addPile = mainExports.addPile = (name, factoryFn) ->
    oldFn = if piles[name] then piles[name] else null
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
   *
   * @returns {Piler.Main.BasePile}
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

