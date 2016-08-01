Gaze = require('gaze').Gaze


try
  socketio = require('socket.io')
catch e
  socketio = null

incUrlSeq = (url) ->
  seqRegexp = /(--([0-9]+))\..*$/
  match = url.match seqRegexp
  seq = parseInt match?[2] or 0, 10

  if match
    cleanUrl = url.replace match[1], ""
  else
    cleanUrl = url

  cleanUrl = cleanUrl.substr(0,cleanUrl.lastIndexOf('.'))+"--#{ seq+1 }"+cleanUrl.substr(cleanUrl.lastIndexOf('.'))

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

    @io = io.of "/pile"


  liveUpdate: (cssmanager, userio) ->
    if @production
      @logger.info "Not activating live update in production"
      return

    if not @app
      throw new Error 'JSManager must be bind to a http server (Express app)
        before it can live update CSS'

    @installSocketIo userio

    listener = if @server then @server else @app
    listener.on "listening", =>
      @logger.info "Activating CSS updater"
      files = {}
      
      for k, pile of cssmanager.piles
        for codeOb in pile.code
          continue unless codeOb.type is "file"
          files[codeOb.filePath] = codeOb
       
      gaze = new Gaze(Object.keys files)
      gaze.on "changed", (filePath)=>
        @logger.info "updated", filePath 
        @io.emit "update", files[filePath].getId()
    

# For testing
LiveUpdateMixin.incUrlSeq = incUrlSeq

if socketio?
  module.exports = LiveUpdateMixin
else
  module.exports = class LiveUpdateDisabled
    liveUpdate: ->
      @logger.error "No socket.io installed. Live update won't work."

