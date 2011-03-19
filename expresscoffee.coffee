# expressjs
#
#

io = require "socket.io"
express = require 'express'



removeTrailingComma = (s) ->
    s.trim().replace(/,$/, "")

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


addCodeSharing = (app) ->

  clientVars = {}
  clientCodeblocks = []
  compiledClientCode = null

  app.clientVar = (name, value) ->
    if typeof name is "object"
      for k, v of name
        clientVars[k] = v
      return name

    clientVars[name] = value

  app.clientExec = (fn) ->
    clientCodeblocks.push(fn)
    return fn


  app.clientScripts = ["/shared.js"]


  app.dynamicHelpers bundleJavascript: (req, res) ->

    bundle = ""

    for script in app.clientScripts
      bundle += "<script src=\"#{ script }\"></script>"

    return  bundle


  app.get "/shared.js", (req, res) ->

    if compiledClientCode is null
      code = "(function(){\n"

      for name, variable of clientVars

        code += "var #{ name } = #{ codeFrom variable };\n"

      for fn in clientCodeblocks
        code += "(#{ fn })();\n" 

      code += "}());\n"

      compiledClientCode = code

    res.send compiledClientCode, 'Content-Type': 'application/javascript'

  return app







addSocketIO = (app) ->

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
  addCodeSharing addSocketIO app

