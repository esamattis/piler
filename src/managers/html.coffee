module.exports = (Piler) ->

  class HTMLPile extends Piler.getPile('BasePile')
    ###*
     * @member {String} Piler.Main.HTMLPile#ext
     * @default html
    ###
    ext: "html"

    ###*
     * Add line comment
     *
     * @function Piler.Main.HTMLPile#commentLine
     * @returns {String}
     * @instance
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
    ###
    type: HTMLPile
    ###*
     * @member {String} Piler.Main.HTMLManager#contentType
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

      Piler.Main.debug('setting HTMLManager locals')

      response.piler.html =
        addMultiline: @bindToPile('addMultiline')
        addRaw: @bindToPile('addRaw')
        addFile: @bindToPile('addFile')

      @

    render: (namespaces...) ->
      @_prepareNamespaces(namespaces)

      Piler.utils.Q.reduce((pile for id,pile of @piles when id in namespaces), (tags, source) =>
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