fs = require "fs"
path = require "path"
crypto = require 'crypto'

_ = require "underscore"
async = require "async"
coffeescript = require "coffee-script"
stylus = require "stylus"

{minify, beautify} = require "./minify"
ob = require "./serialize"


extension = (filename) ->
  parts = filename.split "."
  parts[parts.length-1]



class BasePile

  urlRoot: "/piles"
  production: false

  constructor: (@name, @production) ->
    @files = []
    @pile = null
    @urls = []
    @devMapping = {}

  pathToId: (path) ->
    path.replace(/\//g, "-")

  shareFs: (filePath) ->
    @files.push filePath
    @devMapping[@pathToId filePath] = filePath

  shareUrl: (url) ->
    @urls.push url

  minify: (pile) ->
    if @production
      minify pile
    else
      pile

  read: (devpath, cb) ->
    filePath = @devMapping[devpath]
    fs.readFile filePath, (err, data) =>
      return cb err if err
      @getCompiler(filePath) data.toString(), (err, code) ->
        cb err, code

  getCompiler: (filePath) ->
    compiler = @compilers[extension filePath]
    if not compiler
      throw new Error "Could not find compiler for #{ filePath }"
    compiler

  _pileUpFiles: (lastCb) ->
    # ugly as hell
    jobs = []
    for filePath in @files
      jobs.push
        compiler: @getCompiler filePath
        filePath: filePath
        result: null

    async.map jobs, (job, done) =>
      fs.readFile job.filePath, (err, data) =>
        throw err if err
        job.compiler data.toString(), (err, compiled) =>
          jobs.compiled = compiled
          done null, compiled
    , (err, result) =>
      @pile = result.join("\n")
      lastCb()



  renderTags: ->
    tags = ""
    for url in @urls
      tags += @wrapInTag url
      tags += "\n"

    for path in @getUrls()
      tags += @wrapInTag path
      tags += "\n"

    tags


  getTagKey: ->
    if @production
      @pileHash
    else
      new Date().getTime()

  _computeHash: ->
    sum = crypto.createHash('sha1')
    sum.update @pile
    @pileHash = sum.digest('hex')


class ScriptPile extends BasePile
  urlRoot: "/piles/script/"

  compilers:
    js: (code, cb) -> cb null, code
    # TODO: exception to cb
    coffee: (code, cb) -> cb null, coffeescript.compile code

  constructor: ->
    super
    @objects = []

  getUrls: ->
    if @production
      return [ "#{ @urlRoot }#{ @name }.js" ]
    else
      ("#{ @urlRoot }dev/#{ @name }/#{ @pathToId path }" for path in @files)

  shareOb: (ob) ->
    @objects.push ob

  _pileObjecs: ->
    pile = ""
    for global, value of @objects
        pile += "window['#{ global }'] = #{ ob.stringify };\n"
    pile

  wrapInTag: (uri) ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\"></script>"

  pileUp: (cb) ->
    pile = ""
    pile += @_pileObjecs()
    @_pileUpFiles =>
      @pile = @minify @pile
      @_computeHash()
      console.log "piled", @pile
      cb?()

class StylePile extends BasePile
  urlRoot: "/piles/style/"

  compilers:
    css: (code, cb) -> cb null, code
    styl: (code, cb) ->
      stylus.render code, cb


  wrapInTag: (uri) ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\"/>"

  pileUp: ->
    @_pileUpFiles =>
      @pile = @minify @pile
      @_computeHash()


  getUrls: ->
    if @production
      return [ "#{ @urlRoot }#{ @name }.css" ]
    else
      ("#{ @urlRoot }dev/#{ path }" for path in @files)

defNs = (fn) ->
  (ns, path) ->
    if arguments.length is 1
      path = ns
      ns = "_global"
    fn.call this, ns, path


class AssetManager

  Type: null

  constructor: (@production) ->
    @piles =
      _global: new @Type "_global", @production

  getPile: (ns) ->
    pile = @piles[ns]
    if not pile
      pile =  @piles[ns] = new @Type ns, @production
    pile

  shareFs: defNs (ns, path) ->
    pile = @getPile ns
    pile.shareFs path

  shareUrl: defNs (ns, url) ->
    pile = @getPile ns
    pile.shareUrl url

  pileUp: ->
    for name, pile of @piles
      pile.pileUp()

  renderTags: (namespaces...) ->
    namespaces.unshift "_global"
    tags = ""
    for ns in namespaces
      tags += @piles[ns].renderTags()
    tags

  bind: (app) ->
    app.on 'listening', =>
      @pileUp()
    @addDynamicHelper app

    @addMiddleware app

    # TODO: 404s!

    app.get @Type::urlRoot + ":filename", (req, res) =>
      pileName = req.params.filename.split(".")[0]
      console.log "need to get ", pileName
      res.send @piles[pileName].pile, 'Content-Type': 'application/javascript'

    app.get @Type::urlRoot + "dev/:name/:filename", (req, res) =>
      pile = @piles[req.params.name]
      pile.read req.params.filename, (err, code) =>
        res.send code, 'Content-Type': @contentType



class ScriptManager extends AssetManager
  Type: ScriptPile
  contentType: "application/javascript"

  addDynamicHelper: (app) ->
    app.dynamicHelpers renderScriptTags: (req, res) =>
      return =>
        bundle = @renderTags.apply this, arguments
        for fn in res._responseFns
          bundle += wrapInScriptTagInline executableFrom fn
        bundle

  addMiddleware: (app) ->
    responseExec = (fn) ->
      # "this" is the response object
      this._responseFns.push fn

    # Middleware that adds share & exec methods to response objects.
    app.use (req, res, next) ->
      res._responseFns ?= []
      res.exec = responseExec
      next()

class StyleManager extends AssetManager
  Type: StylePile
  contentType: "text/css"

  addDynamicHelper: (app) ->
    app.dynamicHelpers renderStyleTags: (req, res) =>
      return => @renderTags.apply this, arguments


  addMiddleware: (app) ->

# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"

wrapInScriptTagInline = (code) ->
  "<script type=\"text/javascript\" >\n#{ code }\n</script>\n"





production = process.env.NODE_ENV == "production"

exports.style = new StyleManager production
exports.script = new ScriptManager production

if require.main is module
  m = new ScriptManager true

  m.shareUrl "http://gosdf"
  m.shareFs "foo", "/home/epeli/projects/node-pile/lib/codesharing.coffee"
  m.shareFs "bar", "/home/epeli/projects/node-pile/lib/serialize.coffee"
  m.shareFs "/home/epeli/projects/node-pile/lib/minify.coffee"

  m.pileUp()
  console.log m.renderTags("bar")





