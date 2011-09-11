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
    sum = crypto.createHash('sha1')
    sum.update path

    newExt = @compilers[extension path]?.targetExt
    filename = _.last path.split("/")
    if newExt
        filename = filename + ".#{ newExt }"

    # Should be unique enough. Matters only if user has assets with same
    # filename
    id = sum.digest('hex').substring 5, 0

    id + "-" + filename

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

    tags += @extraTags()


    if @production
      tags += @wrapInTag @getProductionUrl()
      tags += "\n"
    else
      for path in @files
        tags += @wrapInTag @convertToDevUrl(path), "id=\"#{ @pathToId path }\""
        tags += "\n"


    tags

  extraTags: -> ""

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

class JSPile extends BasePile
  urlRoot: "/piles/js/"


  constructor: ->
    super
    @objects = []
    @execs = []


  getProductionUrl: ->
    "#{ @urlRoot }min/#{ @name }.js"

  addOb: (ob) ->
    @objects.push ob

  addExec: (fn) ->
    @objects.push _exec: fn

  extraTags: ->
    tags = ""

    # in production these will be added during pileUp.  Objects don't have a
    # file so in development we just add them inlice
    if not @production
      tags += wrapInScriptTagInline @_pileObjecs()
      tags += "\n"

    tags

  _pileObjecs: ->
    code = ""

    for ob in @objects
      for global, value of ob
        if global is "_exec"
          code += executableFrom value
        else
          code += "  window['#{ global }'] = #{ OB.stringify value };\n"

    "(function() {\n#{code} }\n)();"




  wrapInTag: (uri, extra="") ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } ></script>"

  pileUp: (cb) ->
    @_pileUpFiles (err, code) =>
      @rawPile = @minify  @_pileObjecs() + code
      @_computeHash()
      cb?()

class CSSPile extends BasePile
  urlRoot: "/piles/css/"



  wrapInTag: (uri, extra="") ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } />"

  pileUp: (cb) ->
    @_pileUpFiles (err, code) =>
      @rawPile = code
      @_computeHash()
      cb?()


  getProductionUrl: ->
    "#{ @urlRoot }min/#{ @name }.css"

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

    @app = app

    app.on 'listening', =>
      @pileUp()
    @setDynamicHelper app


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





