'use strict'

socketio = null
gaze = require 'gaze'

###istanbul ignore catch ###
try
  socketio = require('socket.io')
catch


incUrlSeq = (url) ->
  seqRegexp = /(--([0-9]+))\..*$/
  match = url.match seqRegexp
  seq = parseInt match?[2] or 0, 10

  if match
    cleanUrl = url.replace match[1], ""
  else
    cleanUrl = url

  cleanUrl.substr(0,cleanUrl.lastIndexOf('.'))+"--#{ seq+1 }"+cleanUrl.substr(cleanUrl.lastIndexOf('.'))

# Yep, this function will be executed in the browser.
###istanbul ignore next: can't coverage client code###
clientUpdater = ->
  console.log "CSS updater is active. Waiting for connection..."

  pile = io.connect('/pile')

  pile.on "connect", ->
    console.log "CSS updater has connected"
    return

  pile.on "disconnect", ->
    console.log "CSS updater has disconnected! Refresh to reconnect"
    return

  pile.on "update", (fileId) ->
    elem = document.getElementById "pile-" + fileId
    if elem
      console.log "updating", fileId, elem
      elem.href = PILE.incUrlSeq elem.href
    else
      console.log "id", fileId, "not found"

    return

  return

class LiveUpdateMixin

  installSocketIo: (userio) ->

    @addUrl "/socket.io/socket.io.js"

    @addOb PILE:
      incUrlSeq: incUrlSeq

    @addExec clientUpdater

    if not userio
      io = socketio.listen @server
    else
      io = userio

    @io = io.of "/pile"


  liveUpdate: (cssmanager, userio) ->
    if @production
      @logger.info "Not activating live update in production"
      return

    if not @server
      throw new Error 'JSManager must be bind to a http server (Express app)
        before it can live update CSS'

    @installSocketIo userio

    logger = @logger

    @server.on "listening", ->
      logger.info "Activating CSS updater"

      for k, pile of cssmanager.piles
        for codeOb in pile.code
          @_watch pile, codeOb


  _watch: (pile, codeOb) ->
    return unless codeOb.type is "file"
    logger = @logger
    io = @io
    @logger.info "watching #{ codeOb.filePath } for changes"

    gaze codeOb.filePath, (err, watcher) ->

      watcher.on('changed', ->
        logger.info "updated", codeOb.filePath
        io.emit "update", codeOb.getId()
        return
      )
      return

    return

# For testing
LiveUpdateMixin.incUrlSeq = incUrlSeq

if socketio?
  module.exports = LiveUpdateMixin
else
  ###istanbul ignore next###
  module.exports = class LiveUpdateDisabled
    liveUpdate: ->
      @logger.error "No socket.io installed. Live update won't work."
      return

