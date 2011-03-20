
io = require "socket.io"

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

