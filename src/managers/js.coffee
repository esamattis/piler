module.exports = (Piler) ->

  class JSPile extends Piler.getPile('BasePile')
    ###*
     * @member {String} Piler.Main.JSPile#ext
     * @default js
    ###
    ext: "js"

    ###*
     * Add line comment
     *
     * @function Piler.Main.JSPile#commentLine
     * @returns {String}
     * @instance
    ###
    commentLine: (line) ->
      "/* #{ line.trim() } */"

    ###*
     * @augments Piler.Main.BasePile
     * @constructor Piler.Main.JSPile
    ###
    constructor: ->
      super

    ###*
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addModule
     * @param {String} filePath
     * @param {Object} [options={}]
     * @returns {Promise}
    ###
    addModule: (filePath, options = {}) ->
      filePath = Piler.utils.path.normalize filePath

      @duplicated('file', filePath).then(
        =>
          @add({type: "module", object: filePath, options})
      )

    ###*
     * Add a object
     *
     * @function Piler.Main.JSPile#addOb
     * @param {Object} ob
     * @param {Boolean} [options={}]
     * @returns {Promise}
    ###
    addOb: (ob, options = {}) ->
      @duplicated('obj', ob).then(
        =>
          @add({type: "obj", object: ob, options})
      )

    ###*
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addExec
     * @param {Function} fn
     * @param {Boolean} [options={}]
     * @returns {Promise}
    ###
    addExec: (fn, options = {}) ->
      @duplicated('fn', fn).then(
        =>
          @add({type: "fn", object: fn, options})
      )

  class JSManager extends Piler.getManager('PileManager')
    ###*
     * @member {Piler.Main.JSPile} Piler.Main.JSManager#type
    ###
    type: JSPile
    ###*
     * @member {String} Piler.Main.JSManager#contentType
    ###
    contentType: "application/javascript"

    ###*
     * @constructor Piler.Main.JSManager
     * @augments Piler.Main.PileManager
    ###
    constructor: (@name, @options)->
      super(@name, @options)

      Piler.utils._.defaults(@options, {
        scriptType: true
      })

      @piles.global.addExec ->
        window.piler ?= {}

        window.piler.namespace = namespace = (nsString) ->
          parent = window
          for ns in nsString.split "."
            # Create new namespace if it is missing
            parent = parent[ns] ?= {}
          parent # return the asked namespace

        window.piler.set = (ns, ob) ->
          parts = ns.split "."
          if parts.length is 1
            window[parts[0]] = ob
          else
            nsOb = namespace(parts.slice(0, -1).join("."))
            target = parts.slice(-1)[0]
            nsOb[target] = ob

        return

      return

    ###*
     * @function Piler.Main.JSManager#wrapInTag
     * @returns {String}
    ###
    wrapInTag: (uri, extra = "") ->
      "<script#{if @options.scriptType then ' type="text/javascript"' else ''} src=\"#{ uri }\" #{ extra }></script>"

    ###*
     * @function Piler.Main.JSManager#_isReserved
     * @private
     * @param {String} ns
     * @throws Error
    ###
    _isReserved: (ns) ->
      if ns and ns.namespace and (Piler.utils.reserved.indexOf(ns.namespace) isnt -1)
        throw new Error("#{ns} is a reserved word and can't be used")

      return

    ###*
     * @function Piler.Main.JSManager#addModule
     * @param {String} path
     * @param {Boolean} [options]
     * @returns {Promise}
    ###
    addModule: (path, options) ->
      @_isReserved(options)
      @add('addModule', path, options)

    ###*
     * @function Piler.Main.JSManager#addOb
     * @param {String} ob
     * @param {Boolean} [options]
     * @returns {Promise}
    ###
    addOb: (ob, options) ->
      @_isReserved(options)
      @add('addOb', ob, options)

    ###*
     * @function Piler.Main.JSManager#addExec
     * @param {String} fn
     * @param {Boolean} [options]
     * @returns {Promise}
    ###
    addExec: (fn, options) ->
      @_isReserved(options)
      @add('addExec', fn, options)

    ###*
     * @function Piler.Main.JSManager#setMiddleware
     * @returns {Promise}
    ###
    locals: (response) ->
      super(response)

      if not Piler.utils.objectPath.get(@, 'js.namespace')
        Piler.Main.debug('setting JSManager locals')
        namespace = @createTempNamespace()
        Piler.utils.objectPath.set(@,'js.namespace', namespace)
      else
        namespace = @js.namespace

      response.piler.js =
        namespace: namespace
        addExec: @bindToPile('addExec', namespace)
        addRaw: @bindToPile('addRaw', namespace)
        addOb: @bindToPile('addOb', namespace)
        addModule: @bindToPile('addModule', namespace)
        addFile: @bindToPile('addFile', namespace)
        addUrl: @bindToPile('addUrl', namespace)
        addMultiline: @bindToPile('addMultiline', namespace)

      @

    middleware: ->
      super

  # Add the function serializable
  Piler.addSerializable('fn', ->
    # Creates immediately executable string presentation of given function.
    # context will be function's "this" if given.
    executableFrom = (fn, context) ->
      return "(#{ fn })();\n" unless context
      return "(#{ fn }).call(#{ context });\n"

    (ob) ->
      executableFrom ob.object()
  )

  # Add the object serializable
  Piler.addSerializable('obj', ->
    toGlobals = (globals) ->
      code = []
      for nsString, v of globals
        code.push "piler.set(#{ JSON.stringify nsString }, #{ Piler.Serialize.stringify v });"
      code.join('\n')

    (ob) ->
      toGlobals ob.object()
  )

  # Add the module serializable
  Piler.addSerializable('module', ->

    (ob) ->
      @file(ob).then (code) ->
        """require.register("#{ Piler.utils.path.basename(ob.object()).split(".")[0] }", function(module, exports, require) {
        #{ code }
        });"""
  )

  Piler.addManager('js', ->
    JSManager
  )

  Piler.addPile('js', ->
    JSPile
  )

  return