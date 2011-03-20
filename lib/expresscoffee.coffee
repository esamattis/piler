# expressjs
#
#

fs = require "fs"
io = require "socket.io"
express = require 'express'
coffeescript = require "coffee-script"


{minify, beautify} = require "./minify"


removeTrailingComma = (s) ->
  s.trim().replace(/,$/, "")

getCurrentTimestamp = -> (new Date()).getTime()
startTime = getCurrentTimestamp()


types =
  function: (fn) -> "#{ fn }"
  string: (s) -> "\"#{ s }\""
  number: (n) -> n.toString()

  object: (obj) ->

    # typeof reports array as object
    return this._array obj if Array.isArray obj

    code = "{"
    code +=  "\"#{ k }\": #{ codeFrom v }," for k, v of obj
    removeTrailingComma(code) + "}"

  _array: (array) ->
    code = "["
    code += " #{ codeFrom v },"  for v in array
    removeTrailingComma(code) + "]"


codeFrom = (obj) ->
  types[typeof obj]?(obj)


executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"


wrapInScriptTagInline = (code) ->
  "<script>\n#{ code }\n</script>\n"

wrapInScriptTag = (path, killcache) ->
  timestamp = if killcache then getCurrentTimestamp() else startTime
  "<script src=\"#{ path }?v=#{ timestamp }\"></script>"



exports.addCodeSharing = addCodeSharing = (app) ->

  # Set default scripts-directory
  if not app.set "clientscripts"
    app.set "clientscripts", "#{ process.cwd() }/clientscripts"


  # Path to a directory of client-side only scripts
  scriptDir = app.set "clientscripts"

  # All code that is embedded in Node.js code that will be sent to browser.
  # Create common namespace for shared code
  compiledEmbeddedCode = "window.EXPRESS_NAMESPACE = {};\n"

  # All client-side code in production (except externals)
  productionClientCode = ""

  # List of functions that are ran when the app starts listening a port
  runOnListen = []

  # Array of client-side script names
  clientScriptsFs = fs.readdirSync(scriptDir).sort() # TODO: recursive

  # Array of external client-side script urls
  scriptURLs = []

  # Variables that are shared with Node.js and browser
  clientVars = {}

  # Function for getting all script tags. 
  # Configure will create this.
  getScriptTags = null


  
  runOnListen.push ->
    # Collect shared variables and functions

    # Wrap in closure
    compiledEmbeddedCode += "(function(){\n"

    variableNames = (name for name, _ of clientVars).join(", ")

    # Shared variables can be found from "this" or as variables in this scope
    compiledEmbeddedCode += "var #{ removeTrailingComma variableNames };\n"
    for name, variable of clientVars
      compiledEmbeddedCode += "#{ name } = this.#{ name } = #{ codeFrom variable };\n"

    # Collect immediately executable code
    for fn in clientExecs
      compiledEmbeddedCode += executableFrom fn

    # "this" will be EXPRESS_NAMESPACE instead of global window
    compiledEmbeddedCode += "}).call(EXPRESS_NAMESPACE);\n"
    compiledEmbeddedCode = beautify compiledEmbeddedCode
    


  app.configure "development", ->

    getScriptTags = ->

      # External client scripts. CDNs etc.
      tags = (wrapInScriptTag url, true for url  in scriptURLs)

      # Client scripts on filesystem
      for  script in clientScriptsFs
        script = script.trim().replace(/\.coffee$/, ".js")
        tags.push wrapInScriptTag "/managedjs/dev/#{ script }", true

      # Embedded scripts
      tags.push wrapInScriptTag "/managedjs/shared.js", true
      return tags


  app.configure "production", ->
    

    getScriptTags = ->

      # External client scripts
      tags = (wrapInScriptTag url for url  in scriptURLs)
      # Everything else is bundled in production.js
      tags.push wrapInScriptTag "/managedjs/production.js"

      return tags


    # We will allow usage of production.js only in production mode 
    runOnListen.push ->
      for script in clientScriptsFs
        script = "#{ scriptDir }/#{ script }"
        console.log "compile #{ script }"
        if script.match /\.js$/
          productionClientCode +=  fs.readFileSync(script).toString()
        else if script.match /\.coffee$/
          productionClientCode += coffeescript.compile fs.readFileSync(script).toString()

      productionClientCode += compiledEmbeddedCode
      productionClientCode = minify productionClientCode


    app.get "/managedjs/production.js", (req, res) ->
      # TODO: Set cache time to forever
      res.send productionClientCode, 'Content-Type': 'application/javascript'


  app.dynamicHelpers bundleJavascript: (req, res) ->

    bundle = getScriptTags().join("\n")

    # Add code that should be executed only on this request
    if typeof res.exec == "function"
      bundle += wrapInScriptTagInline executableFrom res.exec, "EXPRESS_NAMESPACE"
    else if  Array.isArray res.exec
      for fn in res.exec
        bundle += wrapInScriptTagInline executableFrom fn, "EXPRESS_NAMESPACE"

    return  bundle




  app.get "/managedjs/shared.js", (req, res) ->
    res.send compiledEmbeddedCode, 'Content-Type': 'application/javascript'


  app.get "/managedjs/dev/:script.js", (req, res) ->
    fs.readFile "#{ scriptDir }/#{ req.params.script }.js", (err, data) ->
      if not err
        res.send data, 'Content-Type': 'application/javascript'
      else
        fs.readFile "#{ scriptDir }/#{ req.params.script }.coffee", (err, data) ->
          if not err
            res.send coffeescript.compile(data.toString())
              , 'Content-Type': 'application/javascript'
          else
            res.send "Could not find script #{ req.params.script }.js"
             , ('Content-Type': 'text/plain'), 404


  ## Expressjs extensions
  app.var = (name, value) ->
    if typeof name is "object"
      for k, v of name
        clientVars[k] = v
      return name

    clientVars[name] = value

  clientExecs = []
  app.exec = (fn) ->
    clientExecs.push(fn)
    return fn


  app.scriptURL = (obj) ->
    if Array.isArray obj
      scriptURLs.unshift url for url in obj.reverse()
    else
      scriptURLs.unshift obj
    



  # Run when app starts listening a port
  app.on 'listening', ->
    fn() for fn in runOnListen
















  return app



exports.addSocketIO = addSocketIO = (app) ->

  clients = {}
  msgListeners = {}

  app.socket = io.listen app
  app.msg = (name, fn) ->
    msgListeners[name] = fn

  app.socket.on 'connection', (client) ->
    console.log "client #{ clients.sessionId } connected"
    clients[client.sessionId] = client
    client.on 'message', (raw_msg) ->
      msg = JSON.parse raw_msg
      msgListeners[msg.name]?(msg, client)

  app.socket.on 'disconnect', (client) ->
    console.log "client #{ clients.sessionId } disconnected"
    delete clients[client.sessionId]

  return app



exports.createServer = ->
  app = express.createServer()

  app.configure 'development', ->
    app.use express.errorHandler dumpExceptions: true, showStack: true

  app.configure 'production', ->
    app.use express.errorHandler()


  addCodeSharing addSocketIO app

