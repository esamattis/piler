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
      "// #{ line.trim() }"

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
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSPile} `this`
    ###
    addModule: (filePath, before = false) ->
      filePath = Piler.utils.path.normalize filePath
      if filePath not in @getFilePaths()
        @add({type: "module", object: filePath}, before)

      @

    ###*
     * Add a object
     *
     * @function Piler.Main.JSPile#addOb
     * @param {Object} ob
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSPile} `this`
    ###
    addOb: (ob, before = false) ->
      @add({type: "object", object: ob}, before)
      @

    ###*
     * Add a CommonJS module
     *
     * @function Piler.Main.JSPile#addExec
     * @param {Function} fn
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSPile} `this`
    ###
    addExec: (fn, before = false) ->
      @add({type: "fn", object: fn}, before)
      @

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
     * @function Piler.Main.JSManager#wrapInTag
     * @returns {String}
    ###
    wrapInTag: (uri, extra = "") ->
      "<script type=\"text/javascript\"  src=\"#{ uri }\" #{ extra } ></script>"

    ###*
     * @function Piler.Main.JSManager#_isReserved
     * @private
     * @param {String} ns
     * @throws Error
    ###
    _isReserved: (ns) ->
      if Piler.utils.reserved.indexOf(ns) isnt -1
        throw new Error("#{ns} is a reserved word and can't be used")

      return

    ###*
     * @function Piler.Main.JSManager#addModule
     * @param {String} ns
     * @param {String} path
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSManager} `this`
    ###
    addModule: (ns, path, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addModule path, before
      @

    ###*
     * @function Piler.Main.JSManager#addOb
     * @param {String} ns
     * @param {String} ob
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSManager} `this`
    ###
    addOb:  (ns, ob, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addOb ob, before
      @

    ###*
     * @function Piler.Main.JSManager#addExec
     * @param {String} ns
     * @param {String} fn
     * @param {Boolean} [before=false]
     * @returns {Piler.Main.JSManager} `this`
    ###
    addExec:  (ns, fn, before = false) ->
      @_isReserved(ns)
      pile = @getPile ns
      pile.addExec fn, before
      @

    ###*
     * @function Piler.Main.JSManager#setMiddleware
     * @returns {Piler.Main.JSManager} `this`
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

  Piler.addManager('js', ->
    JSManager
  )

  Piler.addPile('js', ->
    JSPile
  )

  return