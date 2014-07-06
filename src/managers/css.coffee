module.exports = (Piler) ->

  class CSSPile extends Piler.getPile('BasePile')
    ###*
     * @member {String} ext
     * @memberof Piler.Main.CSSPile
     * @instance
    ###
    ext: 'css'

    processors: {
      'less': {}
      'styl': {}
    }

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
      "/* #{ line.trim() } */"


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
    contentType: 'text/css'

    ###*
     * @constructor Piler.Main.CSSManager
     * @augments Piler.Main.PileManager
    ###
    constructor: (@name, @options)->
      super(@name, @options)

    ###*
     * Wrap a stylesheet path in a link tag
     *
     * @memberof Piler.CSSManager
     * @function wrapInTag
     * @instance
     * @returns {String}
    ###
    wrapInTag: (uri, extra = '') ->
      "<link rel=\"stylesheet\" href=\"#{ uri }\" #{ extra }/>"

    ###*
     * @function Piler.Main.CSSManager#locals
    ###
    locals: (response) ->
      super(response)

      if not Piler.utils.objectPath.get(@, 'css.namespace')
        Piler.Main.debug('setting CSSManager locals')
        namespace = @createTempNamespace()
        Piler.utils.objectPath.set(@, 'css.namespace', namespace)
      else
        namespace = @css.namespace

      response.piler.css = {
        namespace   : namespace
        addRaw      : @bindToPile('addRaw', namespace)
        addFile     : @bindToPile('addFile', namespace)
        addUrl      : @bindToPile('addUrl', namespace)
        addMultiline: @bindToPile('addMultiline', namespace)
      }

      @

    middleware: ->
      super

  Piler.addManager('css', ->
    CSSManager
  )

  Piler.addPile('css', ->
    CSSPile
  )

  return