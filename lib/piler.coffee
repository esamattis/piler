fs = require "fs"
path = require "path"
crypto = require 'crypto'
path = require "path"

_ = require "underscore"
async = require "async"

{jsMinify, cssMinify} = require "./minify"
OB = require "./serialize"
compilers = require "./compilers"
assetUrlParse = require "./asseturlparse"

toGlobals = (globals) ->
  code = ""
  for nsString, v of globals
    code += "__SET(#{ JSON.stringify nsString }, #{ OB.stringify v });\n"
  code


extension = (filename) ->
  parts = filename.split "."
  parts[parts.length-1]

wrapInScriptTagInline = (code) ->
  "<script type=\"text/javascript\" >\n#{ code }\n</script>\n"

getCompiler = (filePath) ->
  compiler = compilers[extension filePath]
  if not compiler
    throw new Error "Could not find compiler for #{ filePath }"
  compiler.render

#http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
asCodeOb = do ->
  getId = ->
    sum = crypto.createHash('sha1')


    if @type is "file"
      # If code is on filesystem the url to the file should only change when
      # the path to it changes.
      sum.update @filePath
    else
      # If there is no file for code code. We need to generate id from the code
      # itself.
      sum.update OB.stringify @

    hash = sum.digest('hex').substring 10, 0

    if @type is "file"
      filename = _.last @filePath.split("/")
      filename = filename.replace /\./g, "_"
      filename = filename.replace /\-/g, "_"
      hash = filename + "_" + hash

    return hash
  pilers =
    raw: (ob, cb) -> cb null, ob.raw
    object: (ob, cb) ->
      cb null, toGlobals ob.object
    exec: (ob, cb) ->
      cb null, executableFrom ob.object
    file: (ob, cb) ->
      fs.readFile ob.filePath, (err, data) =>
        return cb? err if err
        getCompiler(ob.filePath) data.toString(), (err, code) ->
          cb err, code

  return ->
    @getId = getId
    @getCode = (cb) ->
      pilers[@type] @, cb
    return @


class BasePile
  urlRoot: "/piler/"

  production: false

  constructor: (@name, @production, urlRoot) ->
    if urlRoot?
      @urlRoot = urlRoot

    @code = []
    @rawPile = null
    @urls = []
    @devMapping = {}
    @piledUp = false

  addFile: (filePath) ->
    filePath = path.normalize filePath
    @warnPiledUp "addFile"
    if filePath not in @getFilePaths()
      @code.push asCodeOb.call
        type: "file"
        filePath: filePath


  addRaw: (raw) ->
    @warnPiledUp "addRaw"
    @code.push asCodeOb.call
      type: "raw"
      raw: raw

  getFilePaths: ->
    (ob.filePath for ob in @code when ob.type is "file")

  addUrl: (url) ->
    if url not in @urls
      @urls.push url


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
        tags += @wrapInTag "#{ @urlRoot }dev/#{ @name }.#{ ob.type }-#{ ob.getId() }.#{ @ext }", "id=\"pile-#{ ob.getId() }\""
        tags += "\n"

    tags


  findCodeObById: (id) ->
    (codeOb for codeOb in @code when codeOb.getId() is id)[0]

  findCodeObByFilePath: (path) ->
    (codeOb for codeOb in @code when codeOb.filePath is id)[0]


  getProductionUrl: ->
    "#{ @urlRoot }min/#{ @name }.#{ @ext }"

  getTagKey: ->
    if @production
      @pileHash
    else
      new Date().getTime()

  _computeHash: ->
    sum = crypto.createHash('sha1')
    sum.update @rawPile
    @pileHash = sum.digest('hex')

  warnPiledUp: (fnname) ->
    if @piledUp
      console.log "Warning pile #{ @name } has been already piled up. Calling #{ fnname } does not do anything."

  pileUp: (cb) ->
    @piledUp = true

    async.map @code, (codeOb, cb) =>
      codeOb.getCode (err, code) =>
        return cb? err if err #                                           TODO: minifying here does not work!?
        cb null, @commentLine("#{ codeOb.type }: #{ codeOb.getId() }") + "\n#{ code }"

    , (err, result) =>
      return cb? err if err
      @rawPile = @minify result.join("\n\n").trim()
      @_computeHash()
      cb? null, @rawPile




class JSPile extends BasePile
  ext: "js"

  commentLine: (line) ->
    return "// #{ line.trim() }"

  minify: (code) ->
    if @production
      jsMinify code
    else
      code

  constructor: ->
    super
    @objects = []



  addOb: (ob) ->
    @warnPiledUp "addOb"
    @code.push asCodeOb.call
      type: "object"
      object: ob


  addExec: (fn) ->
    @warnPiledUp "addExec"
    @code.push asCodeOb.call
      type: "exec"
      object: fn


  wrapInTag: (uri, extra="") ->
    "<script type=\"text/javascript\"  src=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } ></script>"





class CSSPile extends BasePile
  ext: "css"

  commentLine: (line) ->
    return "/* #{ line.trim() } */"

  wrapInTag: (uri, extra="") ->
    "<link rel=\"stylesheet\" href=\"#{ uri }?v=#{ @getTagKey() }\" #{ extra } />"

  minify: (code) ->
    if @production
      cssMinify code
    else
      code


defNs = (fn) ->
  (ns, path) ->
    if arguments.length is 1
      path = ns
      ns = "global"
    fn.call this, ns, path


class PileManager

  Type: null

  constructor: (@settings) ->
    @production = @settings.production
    @settings.urlRoot ?= "/pile/"

    @piles =
      global: new @Type "global", @production, @settings.urlRoot

  getPile: (ns) ->
    pile = @piles[ns]
    if not pile
      pile =  @piles[ns] = new @Type ns, @production, @settings.urlRoot
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
    for name, pile of @piles then do (pile) =>
      pile.pileUp (err, code) =>
        throw err if err
        if @settings.outputDirectory?

          outputPath = path.join @settings.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

          fs.writeFile outputPath, code, (err) ->
            throw err if err
            console.log "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"


  renderTags: (namespaces...) ->
    # Always render global pile
    namespaces.unshift "global"
    tags = ""
    for ns in namespaces
      pile = @piles[ns]
      if pile
        tags += pile.renderTags()
    tags

  bind: (app) ->

    @app = app

    app.on "listening", =>
      @pileUp()

    @setDynamicHelper app


    @setMiddleware app


    app.use (req, res, next) =>

      if not _.startsWith req.url, @settings.urlRoot
        return next()

      res.setHeader "Content-type", @contentType
      asset = assetUrlParse req.url


      pile = @piles[asset.name]

      if not pile
        res.send "Cannot find pile #{ asset.name }"
        return

      # Wrong asset type. Lets skip to next middleware.
      if asset.ext isnt pile.ext
        return next()


      if asset.min
        res.end pile.rawPile
        return

      if asset.dev
        codeOb = pile.findCodeObById asset.dev.uid
        codeOb.getCode (err, code) ->
          throw err if err
          res.end code
          return




class JSManager extends PileManager
  Type: JSPile
  contentType: "application/javascript"

  constructor: ->
    super
    @piles.global.addExec ->
      window._NS = (nsString) ->
        parent = window
        for ns in nsString.split "."
          # Create new namespace if it is missing
          parent = parent[ns] ?= {}
        parent # return the asked namespace

      window.__SET = (ns, ob) ->
        parts = ns.split "."
        if parts.length is 1
          window[parts[0]] = ob
        else
          nsOb = _NS(parts.slice(0, -1).join("."))
          target = parts.slice(-1)[0]
          nsOb[target] = ob



  addOb: defNs (ns, ob) ->
    pile = @getPile ns
    pile.addOb ob

  addExec: defNs (ns, fn) ->
    pile = @getPile ns
    pile.addExec fn

  setDynamicHelper: (app) ->
    app.dynamicHelpers renderScriptTags: (req, res) => =>
      bundle = @renderTags.apply this, arguments
      inline = ""

      if res._responseObs
        for ob in res._responseObs
          inline += toGlobals ob

      if res._responseFns
        for fn in res._responseFns
          inline += executableFrom fn

      bundle + wrapInScriptTagInline inline

  setMiddleware: (app) ->
    responseExec = (fn) ->
      # "this" is the response object
      this._responseFns.push fn

    responseOb = (ob) ->
      this._responseObs.push ob

    # Middleware that adds add & exec methods to response objects.
    app.use (req, res, next) ->
      res._responseFns ?= []
      res._responseObs ?= []

      # TODO: deprecate res.exec
      res.exec = res.addExec = responseExec
      res.addOb = responseOb

      next()

class CSSManager extends PileManager
  Type: CSSPile
  contentType: "text/css"

  setDynamicHelper: (app) ->
    app.dynamicHelpers renderStyleTags: (req, res) => =>
      @renderTags.apply this, arguments


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

exports.createJSManager = (settings={}) ->
  settings.production = production
  new JSManager settings

exports.createCSSManager = (settings={}) ->
  settings.production = production
  new CSSManager settings





