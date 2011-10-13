fs = require "fs"



try
  socketio = require('socket.io')
catch e
  socketio = null

incUrlSeq = (url) ->
  seqRegexp = /--([0-9]+)$/
  match = url.match seqRegexp
  seq = parseInt match?[1] or 0, 10
  cleanUrl = url.replace seqRegexp, ""
  cleanUrl + "--#{ seq+1 }"

# Yep, this function will be executed in the browser.
clientUpdater = ->
  console.log "CSS updater is active. Waiting for connection..."

  pile = io.connect('/pile')

  pile.on "connect", ->
    console.log "CSS updater has connected"

  pile.on "disconnect", ->
    console.log "CSS updater has disconnected! Refresh to reconnect"

  pile.on "update", (fileId) ->
    elem = document.getElementById "pile-" + fileId
    if elem
      console.log "updating", fileId, elem
      elem.href = PILE.incUrlSeq elem.href
    else
      console.log "id", fileId, "not found"

class LiveUpdateMixin

  installSocketIo: (userio) ->

    @addUrl "/socket.io/socket.io.js"
    @addOb PILE:
      incUrlSeq: incUrlSeq
    @addExec clientUpdater

    if not userio
      io = socketio.listen @app
    else
      io = userio

    # Why does not work?
    io.configure ->
      io.set 'log level', 0

    @io = io.of "/pile"


  liveUpdate: (cssmanager, userio) ->
    if @production
      console.log "Not activating live update in production"
      return

    if not @app
      throw new Error 'JSManager must be bind to a http server (Express app)
        before it can live update CSS'

    @installSocketIo userio

    @app.on "listening", =>
      console.log "Activating CSS updater"

      for k, pile of cssmanager.piles
        for codeOb in pile.code then do (codeOb) =>
          return unless codeOb.type is "file"
          console.log "watching #{ codeOb.filePath } for changes"
          fs.watchFile codeOb.filePath, =>
            console.log "updated", codeOb.filePath
            @io.emit "update", codeOb.getId()

# For testing
LiveUpdateMixin.incUrlSeq = incUrlSeq

if socketio?
  module.exports = LiveUpdateMixin
else
  module.exports = class LiveUpdateDisabled
    liveUpdate: ->
      console.log "No socket.io installed. Live update won't work."

