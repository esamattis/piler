fs = require "fs"
path = require "path"
crypto = require 'crypto'

_ = require "underscore"
async = require "async"
coffeescript = require "coffee-script"

{minify, beautify} = require "./minify"
OB = require "./serialize"

compilers =
  css: (code, cb) -> cb null, code
  js: (code, cb) -> cb null, code
  coffee: (code, cb) ->
    try
      cb null, coffeescript.compile code
    catch e
      cb e

compilerExtensionMap =
  coffee: "js"

try
  stylus = require "stylus"
  compilers.styl = (code, cb) ->
    stylus.render code, cb
  compilerExtensionMap.styl = "css"
catch e
  console.log "No stylus", e

extension = (filename) ->
  parts = filename.split "."
  parts[parts.length-1]

wrapInScriptTagInline = (code) ->
  "<script type=\"text/javascript\" >\n#{ code }\n</script>\n"

class BasePile

  compilers: compilers

  urlRoot: "/piles"
  production: false

  constructor: (@name, @production) ->
    @files = []
    @rawPile = null
    @urls = []
    @devMapping = {}

  pathToId: (path) ->
    path = path.replace /\//g, "-"
    for ext, to of compilerExtensionMap
      reg = new RegExp "\.#{ ext }$"
      if reg.test path
        return path + ".#{ to }"

    path

  shareFile: (filePath) ->
    @files.push filePath
    @devMapping[@pathToId filePath] = filePath

  shareUrl: (url) ->
    @urls.push url

  minify: (code) ->
    if @production
      minify code
    else
      code

  readDev: (devpath, cb) ->
    filePath = @devMapping[devpath]

    return cb new Error "No such dev file #{ devpath }" unless filePath

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
      return cb err if err
      pile = result.join("\n")
      lastCb null, pile



  renderTags: ->
    tags = ""
    for url in @urls
      tags += @wrapInTag url
      tags += "\n"

    # TODO: move to JSPile
    if not @production and @_pileObjecs
      tags += wrapInScriptTagInline @_pileObjecs()

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
    sum.update @rawPile
    @pileHash = sum.digest('hex')


class JSPile extends BasePile
  urlRoot: "/piles/js/"


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
    for ob in @objects
      for global, value of ob
          pile += "window['#{ global }'] = #{ OB.stringify value };\n"
      pile

  wrapInTag: (uri) ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\"></script>"

  pileUp: (cb) ->
    # TODO: pile as cb param
    @_pileUpFiles (err, code) =>
      @rawPile = @minify  @_pileObjecs() + code
      @_computeHash()
      cb?()

class CSSPile extends BasePile
  urlRoot: "/piles/css/"



  wrapInTag: (uri) ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\"/>"

  pileUp: ->
    @_pileUpFiles (err, code) =>
      @rawPile = @minify code
      @_computeHash()


  getUrls: ->
    if @production
      return [ "#{ @urlRoot }#{ @name }.css" ]
    else
      ("#{ @urlRoot }dev/#{ @name }/#{ @pathToId path }" for path in @files)

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

  shareFile: defNs (ns, path) ->
    pile = @getPile ns
    pile.shareFile path

  shareUrl: defNs (ns, url) ->
    pile = @getPile ns
    pile.shareUrl url

  pileUp: ->
    for name, pile of @piles
      pile.pileUp()

  renderTags: (namespaces...) ->
    # Always render global pile
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

    app.get @Type::urlRoot + ":filename", (req, res) =>
      pileName = req.params.filename.split(".")[0]
      console.log "need to get ", pileName
      pile = @piles[pileName]
      if not pile
        res.send "Cannot find pile #{ pileName }"
      else
        res.send pile.rawPile, 'Content-Type': @contentType

    app.get @Type::urlRoot + "dev/:name/:filename", (req, res) =>
      pile = @piles[req.params.name]
      pile.readDev req.params.filename, (err, code) =>
        if err
          res.send "#{ err }", 404
        else
          res.send code, 'Content-Type': @contentType



class JSManager extends PileManager
  Type: JSPile
  contentType: "application/javascript"

  shareOb: defNs (ns, ob) ->
    pile = @getPile ns
    pile.shareOb ob

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

class CSSManager extends PileManager
  Type: CSSPile
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






production = process.env.NODE_ENV == "production"

exports.createJSManager = -> new JSManager production
exports.createCSSManager = -> new CSSManager production

if require.main is module
  m = new JSManager true

  m.shareUrl "http://goo"
  m.shareFile "foo", "/home/epeli/projects/node-pile/lib/codesharing.coffee"
  m.shareFile "bar", "/home/epeli/projects/node-pile/lib/serialize.coffee"
  m.shareFile "/home/epeli/projects/node-pile/lib/minify.coffee"

  m.pileUp()
  console.log m.renderTags("bar")





