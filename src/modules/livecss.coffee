module.exports = (Piler) ->
  'use strict'

  socketio = null

  ###*
   * @namespace Piler.LiveCSS
  ###

  out = {
    debug: debug = Piler.utils.debug('piler:livecss')
  }

  ###istanbul ignore catch ###
  try
    socketio = require('socket.io')
  catch

  incUrlSeq = (url) ->
    seqRegexp = /(--([0-9]+))\..*$/
    match = url.match(seqRegexp)
    seq = parseInt(match?[2] or 0, 10)

    if match
      cleanUrl = url.replace(match[1], '')
    else
      cleanUrl = url

    cleanUrl.substr(0, cleanUrl.lastIndexOf('.')) + "--#{ seq+1 }" + cleanUrl.substr(cleanUrl.lastIndexOf('.'))

  # Yep, this function will be executed in the browser.
  ###istanbul ignore next: can't coverage client code###
  clientUpdater = ->
    console.log('CSS updater is active. Waiting for connection...')

    pile = io.connect('/pile')

    pile.on('connect', ->
      console.log('CSS updater has connected')
      return
    )

    pile.on('disconnect', ->
      console.log('CSS updater has disconnected! Refresh to reconnect')
      return
    )

    pile.on('update', (fileId) ->
      elem = document.getElementById("pile-#{fileId}")
      if elem
        console.log('updating', fileId, elem)
        elem.href = piler.livecss.incUrlSeq(elem.href)
      else
        console.log('id', fileId, 'not found')

      return
    )

    return

  # For testing
  out.incUrlSeq = incUrlSeq

  ###istanbul ignore else###
  if socketio?
    ###*
     * @function Piler.LiveCSS.init
     * @param {Piler.Main.JSManager} jsmanager
     * @param {Piler.Main.CSSManager} cssmanager
     * @param {Server} server
     * @param {Socket.IO} [io]
     * @returns {Socket.IO} Socket.io "/pile" namespace
    ###
    out.init = (jsmanager, cssmanager, server, io) ->
      if not server
        throw new Error('LiveCSS must bind to an http server
                  before it can live update CSS')

      logger = jsmanager.options.logger

      if jsmanager.options.env is 'production'
        logger.info('Not activating live update in production')
        return

      _watch = (pile, codeOb) ->

        logger.info("Watching #{codeOb.options.filePath} for changes")

        ###istanbul ignore next: no need to really test file I/O###
        Piler.utils.fs.watch(codeOb.options.filePath, (type) ->
          if type is 'change'
            logger.info('updated', codeOb.options.filePath)
            namespace.emit('update', codeOb.id())
          return
        )

        return

      if not io
        io = socketio(server)

      namespace = io.of('/pile')

      jsmanager.batch([
        ['addUrl', '/socket.io/socket.io.js']
        ['addOb', {'piler.livecss': {incUrlSeq: incUrlSeq}}]
        ['addExec', clientUpdater]
      ])

      logger.info('Activating CSS updater')

      for k, pile of cssmanager.piles
        for codeOb in pile.assets
          if codeOb.options.filePath
            _watch(pile, codeOb)

      namespace

  else
    ###istanbul ignore next###
    out.init = (jsmanager) ->
      jsmanager.options.logger.error('No socket.io installed. Live update won\'t work.')
      return

  out

