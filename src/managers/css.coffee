module.exports = (Piler) ->

  class CSSPile extends Piler.BasePile
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


  class CSSManager extends Piler.PileManager
    ###*
     * @member {CSSPile} Type
     * @memberof Piler.CSSManager
     * @instance
    ###
    type: CSSPile
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