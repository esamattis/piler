module.exports = (Piler) ->

  class HTMLPile extends Piler.getPile('BasePile')
    ###*
     * @member {String} Piler.Main.HTMLPile#ext
     * @default "html"
    ###
    ext: "html"

    ###*
     * Add line comment
     *
     * @function Piler.Main.HTMLPile#commentLine
     * @returns {String}
    ###
    commentLine: (line) ->
      "<!-- #{ line.trim() } -->"

    ###*
     * @augments Piler.Main.BasePile
     * @constructor Piler.Main.HTMLPile
    ###
    constructor: ->
      super

  class HTMLManager extends Piler.getManager('PileManager')
    ###*
     * @member {Piler.Main.HTMLPile} Piler.Main.HTMLManager#type
     * @default {Piler.Main.HTMLPile}
    ###
    type: HTMLPile
    ###*
     * @member {String} Piler.Main.HTMLManager#contentType
     * @default "text/html"
    ###
    contentType: "text/html"

    ###*
     * @constructor Piler.Main.HTMLManager
     * @augments Piler.Main.PileManager
    ###
    constructor: ->
      super

      return

    ###*
     * @function Piler.Main.HTMLManager#setMiddleware
     * @returns {Piler.Main.HTMLManager} `this`
    ###
    locals: (response) ->
      super(response)

      if not Piler.utils.objectPath.get(@, 'html.namespace')
        Piler.Main.debug('setting HTMLManager locals')
        namespace = @createTempNamespace()
        Piler.utils.objectPath.set(@,'html.namespace', namespace)
      else
        namespace = @html.namespace

      response.piler.html = {
        namespace   : namespace
        addMultiline: @bindToPile('addMultiline', namespace)
        addRaw      : @bindToPile('addRaw', namespace)
        addFile     : @bindToPile('addFile', namespace)
      }

      @

    ###*
     * @function Piler.Main.HTMLManager#render
     * @returns {Promise}
    ###
    render: (namespaces) ->
      namespaces = @_prepareNamespaces(namespaces)

      Piler.utils.Promise.reduce(
        (pile for id,pile of @piles when id in namespaces)
        (tags, source) =>
          source.pileUp().then (code) ->
            tags += "#{code}\n"
      , "")

    middleware: ->
      super

  Piler.addManager('html', ->
    HTMLManager
  )

  Piler.addPile('html', ->
    HTMLPile
  )

  return