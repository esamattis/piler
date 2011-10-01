fs = require "fs"
path = require "path"
crypto = require 'crypto'

_ = require "underscore"
async = require "async"

{minify, beautify} = require "./minify"
OB = require "./serialize"
compilers = require "./compilers"
assetUrlParse = require "./asseturlparse"


extension = (filename) ->
  parts = filename.split "."
  parts[parts.length-1]

wrapInScriptTagInline = (code) ->
  "<script type=\"text/javascript\" >\n#{ code }\n</script>\n"

class BasePile

  compilers: compilers

  production: false

  pilers:
    raw: (ob, cb) -> cb null, ob.raw
    object: (ob, cb) ->
      code = ""
      for k, v of ob.object
        code += "window['#{ k }'] = #{ OB.stringify v };\n"
      cb null, code
    exec: (ob, cb) ->
      cb null, executableFrom ob.object
    file: (ob, cb) ->
      fs.readFile ob.filePath, (err, data) =>
        return cb? err if err
        @getCompiler(ob.filePath) data.toString(), (err, code) ->
          cb err, code



  constructor: (@name, @production) ->
    @code = []
    @rawPile = null
    @urls = []
    @devMapping = {}

  addFile: (filePath) ->
    if filePath not in @getFilePaths()
      id = @pathToId filePath
      @code.push
        type: "file"
        filePath: filePath
        uid: id

      @devMapping[id] = filePath

  addRaw: (raw) ->
    @code.push
      type: "raw"
      raw: raw
      uid: @getUID()

  getFilePaths: ->
    (ob.filePath for ob in @code when ob.type is "file")

  addUrl: (url) ->
    if @urls.indexOf(url) is -1
      @urls.push url




  readDev: (uid, cb) ->
    filePath = @devMapping[uid]
    return cb new Error "No such dev file #{ uid }" unless filePath

    fs.readFile filePath, (err, data) =>
      return cb err if err
      @getCompiler(filePath) data.toString(), (err, code) ->
        cb err, code

  getCompiler: (filePath) ->
    compiler = @compilers[extension filePath]
    if not compiler
      throw new Error "Could not find compiler for #{ filePath }"
    compiler.render



  renderTags: ->
    tags = ""
    for url in @urls
      tags += @wrapInTag url
      tags += "\n"


    if @production
      tags += @wrapInTag @getProductionUrl()
      tags += "\n"
    else
      for ob in @code
        tags += @wrapInTag "/pile/#{ @name }.dev-#{ ob.type }-#{ ob.uid }.#{ @ext }", "id=\"pile-#{ ob.uid }\""
        tags += "\n"

    tags

  # TODO: Could be better :S
  sequence = 0
  getUID: -> "seq#{ sequence++ }"

  getProductionUrl: ->
    "#{ @urlRoot }#{ @name }.min.#{ @ext }"

  getTagKey: ->
    if @production
      @pileHash
    else
      new Date().getTime()

  _computeHash: ->
    sum = crypto.createHash('sha1')
    sum.update @rawPile
    @pileHash = sum.digest('hex')

  convertToDevUrl: (path) ->
    "#{ @urlRoot }dev/#{ @name }/#{ @pathToId path }"

  pileUp: (cb) ->

    async.map @code, (ob, cb) =>
      piler = @pilers[ob.type]
      piler.call @, ob, (err, code) =>
        return cb? err if err
        cb null, @commentLine("#{ ob.type }: #{ ob.uid }") + "\n#{ code }"

    , (err, result) =>
      return cb? err if err
      @rawPile = @minify result.join("\n\n").trim()
      @_computeHash()
      cb? null, @rawPile

  pathToId: (path) ->
    sum = crypto.createHash('sha1')
    sum.update path

    newExt = @compilers[extension path]?.targetExt
    filename = _.last path.split("/")
    if newExt
        filename = filename + ".#{ newExt }"

    # Should be unique enough.
     sum.digest('hex').substring 10, 0


class JSPile extends BasePile
  urlRoot: "/pile/js/"
  ext: "js"

  commentLine: (line) ->
    return "// #{ line.trim() }"

  minify: (code) ->
    if @production
      minify code
    else
      code

  constructor: ->
    super
    @objects = []
    @execs = []



  addOb: (ob) ->
    @code.push
      type: "object"
      object: ob
      uid: @getUID()


  addExec: (fn) ->
    @code.push
      type: "exec"
      object: fn
      uid: @getUID()


  wrapInTag: (uri, extra="") ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } ></script>"





class CSSPile extends BasePile
  urlRoot: "/pile/css/"
  ext: "css"

  commentLine: (line) ->
    return "/* #{ line.trim() } */"

  wrapInTag: (uri, extra="") ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } />"

  # TODO: Which lib to use?
  minify: (code) -> code


defNs = (fn) ->
  (ns, path) ->
    if arguments.length is 1
      path = ns
      ns = "_global"
    fn.call this, ns, path


class PileManager

  Type: null

  constructor: (@production) ->
    @piles =
      _global: new @Type "_global", @production

  getPile: (ns) ->
    pile = @piles[ns]
    if not pile
      pile =  @piles[ns] = new @Type ns, @production
    pile

  addFile: defNs (ns, path) ->
    pile = @getPile ns
    pile.addFile path

  addRaw: defNs (ns, raw) ->
    pile = @getPile ns
    pile.addRaw raw

  addUrl: defNs (ns, url) ->
    pile = @getPile ns
    pile.addUrl url

  pileUp: ->
    for name, pile of @piles
      pile.pileUp()

  renderTags: (namespaces...) ->
    # Always render global pile
    namespaces.unshift "_global"
    tags = ""
    for ns in namespaces
      pile = @piles[ns]
      if pile
        tags += pile.renderTags()
    tags

  bind: (app) ->

    @app = app

    app.on 'listening', =>
      @pileUp()
    @setDynamicHelper app


    @setMiddleware app

    pileUrl = /^\/pile\//

    # /pile/my.min.js
    # /pile/my.dev.js
    #
    #
    # /pile/js/dev/my-object-23432.js
    # /pile/js/dev/my-exec-23432.js
    #
    app.use (req, res, next) =>
      if not pileUrl.test req.url
        return next()

      res.setHeader "Content-type", @contentType
      asset = assetUrlParse req.url


      pile = @piles[asset.name]

      # Wrong asset type. Lets skip to next middleware.
      if asset.ext isnt pile.ext
        return next()

      if not pile
        res.send "Cannot find pile #{ pileName }"
        return

      if asset.min
        res.end pile.rawPile
        return

      if asset.dev
        codeOb = (codeOb for codeOb in pile.code when codeOb.uid is asset.dev.uid)[0]

        piler = pile.pilers[codeOb.type]
        piler.call pile, codeOb, (err, code) ->
          throw err if err
          res.end code
          return



    app.get @Type::urlRoot + "min/:filename", (req, res) =>
      pileName = req.params.filename.split(".")[0]


    app.get @Type::urlRoot + "dev/:name/:filename", (req, res) =>
      pile = @piles[req.params.name]
      pile.readDev req.params.filename, (err, code) =>
        if err
          res.send "error reading: #{ err }", 404
        else
          res.send code, 'Content-Type': @contentType

    app.get @Type::urlRoot + "dev/_object-:name-:uuid.:ext", (req, res) =>


class JSManager extends PileManager
  Type: JSPile
  contentType: "application/javascript"

  addOb: defNs (ns, ob) ->
    pile = @getPile ns
    pile.addOb ob

  addExec: defNs (ns, fn) ->
    pile = @getPile ns
    pile.addExec fn

  setDynamicHelper: (app) ->
    app.dynamicHelpers renderScriptTags: (req, res) => =>
      bundle = @renderTags.apply this, arguments
      if res._responseFns
        for fn in res._responseFns
          bundle += wrapInScriptTagInline executableFrom fn
      bundle

  setMiddleware: (app) ->
    responseExec = (fn) ->
      # "this" is the response object
      this._responseFns.push fn

    # Middleware that adds add & exec methods to response objects.
    app.use (req, res, next) ->
      res._responseFns ?= []
      res.exec = responseExec
      next()

class CSSManager extends PileManager
  Type: CSSPile
  contentType: "text/css"

  setDynamicHelper: (app) ->
    app.dynamicHelpers renderStyleTags: (req, res) =>
      return => @renderTags.apply this, arguments


  setMiddleware: (app) ->

# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"



LiveUpdateMixin = require "./livecss"
_.extend JSManager::, LiveUpdateMixin::

exports.production = production = process.env.NODE_ENV is "production"

exports.CSSPile = CSSPile
exports.JSPile = JSPile
exports.JSManager = JSManager
exports.CSSManager = CSSManager

exports.createJSManager = -> new JSManager production
exports.createCSSManager = -> new CSSManager production





