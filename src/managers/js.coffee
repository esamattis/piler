module.exports = (Piler) ->

  class JSPile extends Piler.BasePile
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
      if filePath not in @getFilePaths()
        @add({type: "module", object: filePath}, before)

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
      @code[if not before then 'push' else 'unshift'] classes.Serialize.codeObject.call
        type: "fn"
        object: fn
      @

  class JSManager extends Piler.PileManager
    type: JSPile
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
