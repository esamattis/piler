module.exports = (classes, options) ->
  'use strict'

  socketio = null

  ###*
   * @namespace Piler.LiveCSS
  ###

  out = {
    debug: debug = classes.utils.debug('piler:livecss')
  }

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

  # For testing
  out.incUrlSeq = incUrlSeq

  ###istanbul ignore else###
  if socketio?
    out.init = (jsmanager, cssmanager, server, io) ->
      if not server
        throw new Error 'LiveCSS must be bind to a http server (Express app)
          before it can live update CSS'

      logger = jsmanager.options.logger

      if jsmanager.options.production
        logger.info 'Not activating live update in production'
        return

      jsmanager.addUrl "/socket.io/socket.io.js"

      jsmanager.addOb PILE: incUrlSeq: incUrlSeq

      jsmanager.addExec clientUpdater

      io ?= socketio.listen server

      namespace = io.of "/pile"

      _watch = (pile, codeOb) ->

        logger.info "Watching #{codeOb.object()} for changes"

        classes.utils.fs.watch codeOb.object(), (type) ->
          if type is 'change'
            logger.info 'updated', codeOb.object()
            namespace.emit 'update', codeOb.id()

          return

      server.on "listening", ->
        logger.info "Activating CSS updater"

        for k, pile of cssmanager.piles
          for codeOb in pile.assets
            if codeOb.type() is 'file'
              _watch pile, codeOb

        return

      return
  else
    ###istanbul ignore next###
    out.init = (jsmanager) ->
      jsmanager.options.logger.error "No socket.io installed. Live update won't work."
      return

  out

