fs = require "fs"
path = require "path"
crypto = require 'crypto'

_ = require "underscore"
async = require "async"

{minify, beautify} = require "./minify"
OB = require "./serialize"
compilers = require "./compilers"


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
    newExt = @compilers[extension path]?.targetExt
    if newExt
        path + ".#{ newExt }"
    else
      path

  addFile: (filePath) ->
    if @files.indexOf(filePath) is -1
      @files.push filePath
      @devMapping[@pathToId filePath] = filePath

  addUrl: (url) ->
    if @urls.indexOf(url) is -1
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
    compiler.render

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
      return [ "#{ @urlRoot }min/#{ @name }.js" ]
    else
      ("#{ @urlRoot }dev/#{ @name }/#{ @pathToId path }" for path in @files)

  addOb: (ob) ->
    @objects.push ob

  _pileObjecs: ->
    code = ""
    for ob in @objects
      for global, value of ob
          code += "  w['#{ global }'] = #{ OB.stringify value };\n"
      "(function(w) {\n#{code} }\n)(window);"

  wrapInTag: (uri) ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\"></script>"

  pileUp: (cb) ->
    @_pileUpFiles (err, code) =>
      @rawPile = @minify  @_pileObjecs() + code
      @_computeHash()
      cb?()

class CSSPile extends BasePile
  urlRoot: "/piles/css/"



  wrapInTag: (uri) ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\"/>"

  pileUp: (cb) ->
    @_pileUpFiles (err, code) =>
      @rawPile = code
      @_computeHash()
      cb?()


  getUrls: ->
    if @production
      return [ "#{ @urlRoot }min/#{ @name }.css" ]
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

  addFile: defNs (ns, path) ->
    pile = @getPile ns
    pile.addFile path

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
    app.on 'listening', =>
      @pileUp()
    @setDynamicHelpoer app


    @setMiddleware app


    app.get @Type::urlRoot + "min/:filename", (req, res) =>
      pileName = req.params.filename.split(".")[0]
      pile = @piles[pileName]
      if not pile
        res.send "Cannot find pile #{ pileName }"
      else
        res.send pile.rawPile, 'Content-Type': @contentType


    app.get @Type::urlRoot + "dev/:name/:filename", (req, res) =>
      pile = @piles[req.params.name]
      pile.readDev req.params.filename, (err, code) =>
        if err
          res.send "error reading: #{ err }", 404
        else
          res.send code, 'Content-Type': @contentType



class JSManager extends PileManager
  Type: JSPile
  contentType: "application/javascript"

  addOb: defNs (ns, ob) ->
    pile = @getPile ns
    pile.addOb ob

  setDynamicHelpoer: (app) ->
    app.dynamicHelpers renderScriptTags: (req, res) =>
      return =>
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

  setDynamicHelpoer: (app) ->
    app.dynamicHelpers renderStyleTags: (req, res) =>
      return => @renderTags.apply this, arguments


  setMiddleware: (app) ->

# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"



exports.production = production = process.env.NODE_ENV == "production"

exports.CSSPile = CSSPile
exports.JSPile = JSPile
exports.JSManager = JSManager
exports.CSSManager = CSSManager

exports.createJSManager = -> new JSManager production
exports.createCSSManager = -> new CSSManager production





