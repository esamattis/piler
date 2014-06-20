module.exports = (Piler) ->

  class CSSPile extends Piler.getPile('BasePile')
    ###*
     * @member {String} ext
     * @memberof Piler.Main.CSSPile
     * @instance
    ###
    ext: "css"

    ###*
     * @constructor Piler.Main.CSSPile
     * @augments Piler.Main.BasePile
    ###
    constructor: ->
      super

    ###*
     * Add a line comment to CSS
     *
     * @memberof Piler.Main.CSSPile
     * @param {String} line
     * @instance
     * @function commentLine
     * @returns {Piler.Main.CSSPile} `this`
    ###
    commentLine: (line) ->
      return "/* #{ line.trim() } */"


  class CSSManager extends Piler.getManager('PileManager')
    ###*
     * @member {Piler.Main.CSSPile} Type
     * @memberof Piler.Main.CSSManager
     * @instance
    ###
    type: CSSPile
    ###*
     * @member {String} contentType
     * @memberof Piler.Main.CSSManager
     * @instance
    ###
    contentType: "text/css"

    ###*
     * @constructor Piler.Main.CSSManager
     * @augments Piler.Main.PileManager
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
    wrapInTag: (uri, extra = "") ->
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

  Piler.addManager('css', ->
    CSSManager
  )

  Piler.addPile('css', ->
    CSSPile
  )

  return