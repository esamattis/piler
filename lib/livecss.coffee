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
  piles = io.connect('/piles')
  piles.on "update", (fileId) ->
    elem = document.getElementById fileId
    elem.href = PILES.incUrlSeq elem.href

class LiveUpdateMixin

  installSocketIo: ->

    @addUrl "/socket.io/socket.io.js"
    @addOb PILES:
      incUrlSeq: incUrlSeq
    @addExec clientUpdater

    io = socketio.listen @app

    # Why does not work?
    io.configure ->
      io.set 'log level', 0

    @io = io.of "/piles"


  liveUpdate: (cssmanager) ->
    if @production
      console.log "Not activating live update in production"
      return

    if not @app
      throw new Error 'JSManager must be bind to a http server (Express app)
        before it can live update CSS'

    @installSocketIo()


    for k, pile of cssmanager.piles
      for file in pile.files then do (file, pile) =>
        fs.watchFile file, =>
          console.log "updated", pile.pathToId file
          @io.emit "update", pile.pathToId file

# For testing
LiveUpdateMixin.incUrlSeq = incUrlSeq

if socketio?
  module.exports = LiveUpdateMixin
else
  module.exports = class LiveUpdateDisabled
    liveUpdate: ->
      console.log "No socket.io installed. Live update won't work."

