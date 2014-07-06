module.exports = function(Piler) {
  'use strict';
  var clientUpdater, debug, incUrlSeq, out, socketio;
  socketio = null;

  /**
   * @namespace Piler.LiveCSS
   */
  out = {
    debug: debug = Piler.utils.debug('piler:livecss')
  };

  /*istanbul ignore catch */
  try {
    socketio = require('socket.io');
  } catch (_error) {

  }
  incUrlSeq = function(url) {
    var cleanUrl, match, seq, seqRegexp;
    seqRegexp = /(--([0-9]+))\..*$/;
    match = url.match(seqRegexp);
    seq = parseInt((match != null ? match[2] : void 0) || 0, 10);
    if (match) {
      cleanUrl = url.replace(match[1], '');
    } else {
      cleanUrl = url;
    }
    return cleanUrl.substr(0, cleanUrl.lastIndexOf('.')) + ("--" + (seq + 1)) + cleanUrl.substr(cleanUrl.lastIndexOf('.'));
  };

  /*istanbul ignore next: can't coverage client code */
  clientUpdater = function() {
    var pile;
    console.log('CSS updater is active. Waiting for connection...');
    pile = io.connect('/pile');
    pile.on('connect', function() {
      console.log('CSS updater has connected');
    });
    pile.on('disconnect', function() {
      console.log('CSS updater has disconnected! Refresh to reconnect');
    });
    pile.on('update', function(fileId) {
      var elem;
      elem = document.getElementById("pile-" + fileId);
      if (elem) {
        console.log('updating', fileId, elem);
        elem.href = piler.livecss.incUrlSeq(elem.href);
      } else {
        console.log('id', fileId, 'not found');
      }
    });
  };
  out.incUrlSeq = incUrlSeq;

  /*istanbul ignore else */
  if (socketio != null) {

    /**
     * @function Piler.LiveCSS.init
     * @param {Piler.Main.JSManager} jsmanager
     * @param {Piler.Main.CSSManager} cssmanager
     * @param {Server} server
     * @param {Socket.IO} [io]
     * @returns {Socket.IO} Socket.io "/pile" namespace
     */
    out.init = function(jsmanager, cssmanager, server, io) {
      var codeOb, k, logger, namespace, pile, _i, _len, _ref, _ref1, _watch;
      if (!server) {
        throw new Error('LiveCSS must bind to an http server before it can live update CSS');
      }
      logger = jsmanager.options.logger;
      if (jsmanager.options.env === 'production') {
        logger.info('Not activating live update in production');
        return;
      }
      _watch = function(pile, codeOb) {
        logger.info("Watching " + codeOb.options.filePath + " for changes");

        /*istanbul ignore next: no need to really test file I/O */
        Piler.utils.fs.watch(codeOb.options.filePath, function(type) {
          if (type === 'change') {
            logger.info('updated', codeOb.options.filePath);
            namespace.emit('update', codeOb.id());
          }
        });
      };
      if (!io) {
        io = socketio(server);
      }
      namespace = io.of('/pile');
      jsmanager.batch([
        ['addUrl', '/socket.io/socket.io.js'], [
          'addOb', {
            'piler.livecss': {
              incUrlSeq: incUrlSeq
            }
          }
        ], ['addExec', clientUpdater]
      ]);
      logger.info('Activating CSS updater');
      _ref = cssmanager.piles;
      for (k in _ref) {
        pile = _ref[k];
        _ref1 = pile.assets;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          codeOb = _ref1[_i];
          if (codeOb.options.filePath) {
            _watch(pile, codeOb);
          }
        }
      }
      return namespace;
    };
  } else {

    /*istanbul ignore next */
    out.init = function(jsmanager) {
      jsmanager.options.logger.error('No socket.io installed. Live update won\'t work.');
    };
  }
  return out;
};
