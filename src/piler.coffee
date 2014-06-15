'use strict'

###*
 * @namespace Piler
###

cache = require './cache'
fs = require "graceful-fs"
path = require "path"
crypto = require 'crypto'
path = require "path"
debug = require("debug")("piler:piler")
reserved = require 'reserved'
_ = require "underscore"
async = require "async"

{jsMinify, cssMinify} = require "./minify"
OB = require "./serialize"
compilers = require "./compilers"
assetUrlParse = require "./asseturlparse"
logger = require "./logger"

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

###*
 * A code object
 * @typedef {Object} Piler.codeOb
 * @property {Function} getId Get the code id
 * @property {Function} getCode Get the code itself
###

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

    if @type  in ["file", "module"]
      filename = path.basename @filePath
      filename = filename.replace /\./g, "_"
      filename = filename.replace /\-/g, "_"
      hash = filename + "_" + hash

    return hash

  pilers =
    raw: (ob, cb) ->
      cb null, ob.raw
      return

    object: (ob, cb) ->
      cb null, toGlobals ob.object
      return

    exec: (ob, cb) ->
      cb null, executableFrom ob.object
      return

    file: (ob, cb) ->
      fs.readFile ob.filePath, (err, data) ->
        return cb? err if err
        getCompiler(ob.filePath) ob.filePath, data.toString(), (err, code) ->
          cb err, code
        return

      return

    module: (ob, cb) ->
      this.file ob, (err, code) ->
        return cb? err if err
        cb null, """require.register("#{ path.basename(ob.filePath).split(".")[0] }", function(module, exports, require) {
        #{ code }
        });"""
        return
      return

  ->
    @getId = getId
    @getCode = (cb) ->
      pilers[@type] @, cb

    @

class BasePile
  ###*
   * @member {String} urlRoot
   * @instance
   * @memberof Piler.BasePile
  ###
  urlRoot: "/piler/"

  ###*
   * @member {Boolean} production
   * @instance
   * @memberof Piler.BasePile
  ###
  production: false

  ###*
   * @constructor Piler.BasePile
  ###
  constructor: (@name, @production, urlRoot, cacheKeys) ->
    if urlRoot?
      @urlRoot = urlRoot

    @code = []
    @rawPile = null
    @urls = []
    @piledUp = false
    @cacheKeys = if cacheKeys isnt undefined then !!cacheKeys else true

  ###*
   * Add an array of files at once
   *
   * @example
   *   Pile.addFile("/path/to/file")
   *
   * @memberof BasePile
   * @function addFile
   * @instance
   * @param {String} filePath Absolute path to the file
   * @param {Boolean} [before] Prepend this file instead of adding to the end of the pile
   *
   * @returns {Piler.BasePile}
  ###
  addFile: (filePath, before = false) ->
    filePath = path.normalize filePath
    @warnPiledUp "addFile"
    if filePath not in @getFilePaths()
      @code[if not before then 'push' else 'unshift'] asCodeOb.call
        type: "file"
        filePath: filePath

    @

  ###*
   * @memberof Piler.BasePile
   * @function addRaw
   * @param {*} raw
   * @param {Boolean} [before]
   * @instance
   * @returns {Piler.BasePile}
  ###
  addRaw: (raw, before = false) ->
    @warnPiledUp "addRaw"
    @code[if not before then 'push' else 'unshift'] asCodeOb.call
      type: "raw"
      raw: raw

    @

  ###*
   * @memberof Piler.BasePile
   * @function getFilePaths
   * @instance
   * @returns {Piler.BasePile}
  ###
  getFilePaths: ->
    (ob.filePath for ob in @code when ob.type is "file")

  ###*
   * @memberof Piler.BasePile
   * @function addUrl
   * @param {String} url
   * @param {Boolean} [before]
   * @instance
   * @returns {Piler.BasePile}
  ###
  addUrl: (url, before = false) ->
    if url not in @urls
      @urls[if not before then 'push' else 'unshift'] url

    @

  ###*
   * @memberof Piler.BasePile
   * @function getSources
   * @instance
   * @returns {Piler.BasePile}
  ###
  getSources: ->
    # Start with plain urls
    sources = ([u] for u in @urls)

    if @production
      sources.push ["#{ @urlRoot }min/#{ @pileHash }/#{ @name }.#{ @ext }"]
    else
      devCacheKey = ''
      if @cacheKeys
        devCacheKey = "?v=#{Date.now()}"
      for ob in @code
        sources.push ["#{ @urlRoot }dev/#{ @name }.#{ ob.type }-#{ ob.getId() }.#{ @ext }#{devCacheKey}", "id=\"pile-#{ ob.getId() }\""]

    return sources

  ###*
   * @memberof Piler.BasePile
   * @function findCodeObById
   * @param {String} id
   * @instance
   * @returns {Piler.codeOb}
  ###
  findCodeObById: (id) ->
    (codeOb for codeOb in @code when codeOb.getId() is id)[0]

  ###*
   * @memberof Piler.BasePile
   * @function findCodeObByFilePath
   * @param {String} path
   * @instance
   * @returns {Piler.codeOb}
  ###
  findCodeObByFilePath: (path) ->
    (codeOb for codeOb in @code when codeOb.filePath is path)[0]

  ###*
   * @memberof {Piler.BasePile}
   * @function _computeHash
   * @instance
   * @private
   *
   * @returns {Piler.BasePile}
  ###
  _computeHash: ->
    sum = crypto.createHash('sha1')
    sum.update @rawPile
    @pileHash = sum.digest('hex')

  ###*
   * @memberof {Piler.BasePile}
   * @function warnPiledUp
   * @instance
   * @protected
  ###
  warnPiledUp: (fnname) ->
    if @piledUp
      @logger.warn "Warning pile #{ @name } has been already piled up. Calling #{ fnname } does not do anything."

    return

  ###*
   * @memberof {Piler.BasePile}
   * @function pileUp
   * @param {Function} [cb]
   * @instance
   * @returns {Piler.BasePile}
  ###
  pileUp: (cb) ->
    @piledUp = true

    async.map @code, (codeOb, cb) =>

      codeOb.getCode (err, code) =>
        return cb? err if err
        cb null, @commentLine("#{ codeOb.type }: #{ codeOb.getId() }") + "\n#{ code }"
        return

      return

    , (err, result) =>
      return cb? err if err
      @rawPile = @minify result.join("\n\n").trim()
      @_computeHash()
      cb? null, @rawPile
      return

    @

class JSPile extends BasePile
  ###*
   * @member {String} ext
   * @memberof Piler.JSPile
   * @instance
  ###
  ext: "js"

  ###*
   * Add line comment
   *
   * @function commentLine
   * @memberof Piler.JSPile
   * @returns {String}
   * @instance
  ###
  commentLine: (line) ->
    "// #{ line.trim() }"

  ###*
   * Minify any valid Javascript code
   *
   * @memberof Piler.JSPile
   * @returns {String}
   * @instance
  ###
  minify: (code) ->
    if @production
      jsMinify code
    else
      code

  ###*
   * @augments Piler.BasePile
   * @constructor Piler.JSPile
  ###
  constructor: ->
    super
    @objects = []

  ###*
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @function addModule
   * @param {String} filePath
   * @param {Boolean} [before]
   * @instance
   * @returns {Piler.JSPile}
  ###
  addModule: (filePath, before = false) ->
    filePath = path.normalize filePath
    @warnPiledUp "addFile"
    if filePath not in @getFilePaths()
      @code[if not before then 'push' else 'unshift'] asCodeOb.call
        type: "module"
        filePath: filePath
    @

  ###*
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @param {Object} ob
   * @param {Boolean} [before]
   * @instance
   * @returns {Piler.JSPile}
  ###
  addOb: (ob, before = false) ->
    @warnPiledUp "addOb"
    @code[if not before then 'push' else 'unshift'] asCodeOb.call
      type: "object"
      object: ob
    @

  ###*
   * Add a CommonJS module
   * @memberof Piler.JSPile
   * @param {Function} fn
   * @param {Boolean} [before]
   * @instance
   * @function addExec
   * @returns {Piler.JSPile}
  ###
  addExec: (fn, before = false) ->
    @warnPiledUp "addExec"
    @code[if not before then 'push' else 'unshift'] asCodeOb.call
      type: "exec"
      object: fn
    @

class CSSPile extends BasePile
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
   * @returns {Piler.CSSPile}
  ###
  commentLine: (line) ->
    return "/* #{ line.trim() } */"

  ###*
   * Minify any CSS code
   *
   * @memberof Piler.CSSPile
   * @param {String} code
   * @instance
   * @function minify
   * @returns {Piler.CSSPile}
  ###
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
  ###*
   * @memberof Piler.PileManager
   * @member {Piler.BasePile} Type
   * @instance
  ###
  Type: null

  ###*
   * @constructor Piler.PileManager
  ###
  constructor: (@settings) ->
    @production = @settings.production
    @settings.urlRoot ?= "/pile/"
    @logger = @settings.logger || logger

    @piles =
      global: new @Type "global", @production, @settings.urlRoot

  ###*
   * @memberof Piler.PileManager
   * @instance
   * @function getPile
   * @returnss {Piler.BasePile}
  ###
  getPile: (ns) ->
    pile = @piles[ns]
    if not pile
      pile =  @piles[ns] = new @Type ns, @production, @settings.urlRoot
    pile

  ###*
   * Add an array of files at once
   *
   * @example
   *   PileManager.addFiles("namespace", ["/file/1","/file/2"])
   *
   * @memberof Piler.PileManager
   *
   * @function addFiles
   * @param {String} ns
   * @param {Array} arr
   *
   * @returns {Piler.BasePile}
  ###
  addFiles: defNs (ns, arr) ->
    @addFile(ns, file) for file in arr

    @

  ###*
   * @memberof Piler.PileManager
  ###
  addFile: defNs (ns, path) ->
    pile = @getPile ns
    pile.addFile path

  ###*
   * @memberof Piler.PileManager
  ###
  addRaw: defNs (ns, raw) ->
    pile = @getPile ns
    pile.addRaw raw

  ###*
   * @memberof Piler.PileManager
  ###
  addUrl: defNs (ns, url) ->
    pile = @getPile ns
    pile.addUrl url

  ###*
   * @memberof Piler.PileManager
  ###
  pileUp: ->
    logger = @logger
    logger.notice "Start assets generation for '#{ @Type::ext }'"
    for name, pile of @piles then do (pile) =>
      pile.pileUp (err, code) =>
        throw err if err
        if @settings.outputDirectory?

          outputPath = path.join @settings.outputDirectory,  "#{ pile.name }.#{ pile.ext }"

          fs.writeFile outputPath, code, (err) ->
            throw err if err
            logger.info "Wrote #{ pile.ext } pile #{ pile.name } to #{ outputPath }"

        return
    return

  ###*
   * @memberof Piler.PileManager
  ###
  getSources: (namespaces...) ->
    if typeof _.last(namespaces) is "object"
      opts = namespaces.pop()
    else
      opts = {}

    if not opts.disableGlobal
      namespaces.unshift "global"

    sources = []
    for ns in namespaces
      if pile = @piles[ns]
        sources.push pile.getSources()...
    return sources

  ###*
   * @memberof Piler.PileManager
  ###
  renderTags: (namespaces...) ->

    tags = ""
    for src in @getSources namespaces...
      tags += @wrapInTag src[0], src[1]
      tags += "\n"
    return tags

  ###*
   * @memberof Piler.PileManager
  ###
  bind: (app, server) ->
    if not server
      throw new Error('You must pass an existing server to bind function as second parameter')

    @app = app
    @server = server

    server.on "listening", =>
      @pileUp()
      return

    @setMiddleware app

    app.use (req, res, next) =>

      if not _.startsWith req.url, @settings.urlRoot
        return next()

      res.setHeader "Content-type", @contentType
      asset = assetUrlParse req.url

      # Wrong asset type. Lets skip to next middleware.
      if asset.ext isnt @Type::ext
        return next()

      pile = @piles[asset.name]

      if not pile
        res.send "Cannot find pile #{ asset.name }", 404
        return

      # TODO: set cache headers to forever
      if asset.min
        res.end pile.rawPile
        return

      codeOb = pile.findCodeObById asset.dev.uid
      codeOb.getCode (err, code) ->
        throw err if err
        res.end code
        return

      return

    return

class JSManager extends PileManager
  Type: JSPile
  contentType: "application/javascript"

  ###*
   * @constructor Piler.JSManager
   * @augments Piler.PileManager
  ###
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

    return

  wrapInTag: (uri, extra="") ->
    "<script type=\"text/javascript\"  src=\"#{ uri }\" #{ extra } ></script>"

  _isReserved: (ns) ->
    if reserved.indexOf(ns) isnt -1
      throw new Error("#{ns} is a reserved word and can't be used")

    return

  addModule: defNs (ns, path) ->
    @_isReserved(ns)
    pile = @getPile ns
    pile.addModule path

  addOb: defNs (ns, ob) ->
    @_isReserved(ns)
    pile = @getPile ns
    pile.addOb ob

  addExec: defNs (ns, fn) ->
    @_isReserved(ns)
    pile = @getPile ns
    pile.addExec fn

  setMiddleware: (app) ->
    responseExec = (fn) ->
      # "this" is the response object
      this._responseFns.push fn
      return

    responseOb = (ob) ->
      this._responseObs.push ob
      return

    # Middleware that adds add & exec methods to response objects.
    app.use (req, res, next) ->
      res._responseFns ?= []
      res._responseObs ?= []

      # TODO: deprecate res.exec
      res.exec = res.addExec = responseExec
      res.addOb = responseOb

      next()

      return

    return

class CSSManager extends PileManager
  ###*
   * @member {CSSPile} Type
   * @memberof Piler.CSSManager
   * @instance
  ###
  Type: CSSPile
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

# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"

LiveUpdateMixin = require "./livecss"
_.extend JSManager::, LiveUpdateMixin::

exports.production = production = process.env.NODE_ENV is "production"

exports.BasePile = BasePile
exports.CSSPile = CSSPile
exports.JSPile = JSPile
exports.JSManager = JSManager
exports.CSSManager = CSSManager

###*
 * Create a new JS Manager for adding Javascript files
 *
 * @param {Object} [settings] Settings to pass to JSManager
 *
 * @function Piler.createJSManager
 * @returns {Piler.JSManager}
###
exports.createJSManager = (settings={}) ->
  settings.production = production
  new JSManager settings

###*
 * Create a new CSS Manager for adding stylesheet files
 *
 * @function Piler.createCSSManager
 *
 * @param {Object} [settings] Settings to pass to CSSManager
 * @returns {Piler.CSSManager}
###
exports.createCSSManager = (settings={}) ->
  settings.production = production
  new CSSManager settings

###*
 * Add a compiler to Piler. You can override existing extensions like css or js
 *
 * @function Piler.addCompiler
 *
 * @throws Error
 * @param {String} extension The extension that you want compiling
 * @param {Function} renderFn The function that will be factory for generating code
###
exports.addCompiler = (extension, renderFn) ->
  throw new Error('addCompiler function expects a function as second parameter') if not _.isFunction(renderFn)
  def = renderFn()

  if _.isObject(def) and _.isFunction(def.render)
    compilers[extension] = def
  else
    throw new Error('Your function must return an object containing "render" and optionally "targetExt"')

  return

###*
 * @function Piler.removeCompiler
 * @param {String} extension Extension to remove the compiler
###
exports.removeCompiler = (extension) ->
  delete compilers[extension] if compilers[extension]

  return

###*
 * Add the cache method.
 * By default it uses the filesystem
 *
 * @example
 *   piler.useCache(function(){
 *   });
 *
 * @param {Function} cacheFn Function that will be called with the current code, generated hash and the callback
 * @throws Error
 *
 * @function Piler.useCache
###
exports.useCache = (cacheFn) ->
  throw new Error('useCache expects a function') if not _.isFunction(cacheFn)
  throw new Error('useCache expects a function with 3 arguments defined') if cacheFn.length < 3

  cache.options.useFS = false
  cache.options.cacheCallback = cacheFn

  return
