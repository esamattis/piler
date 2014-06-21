module.exports = function(classes, options) {
  'use strict';
  var clientUpdater, debug, incUrlSeq, out, socketio;
  socketio = null;

  /**
   * @namespace Piler.LiveCSS
   */
  out = {
    debug: debug = classes.utils.debug('piler:livecss')
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
      cleanUrl = url.replace(match[1], "");
    } else {
      cleanUrl = url;
    }
    return cleanUrl.substr(0, cleanUrl.lastIndexOf('.')) + ("--" + (seq + 1)) + cleanUrl.substr(cleanUrl.lastIndexOf('.'));
  };

  /*istanbul ignore next: can't coverage client code */
  clientUpdater = function() {
    var pile;
    console.log("CSS updater is active. Waiting for connection...");
    pile = io.connect('/pile');
    pile.on("connect", function() {
      console.log("CSS updater has connected");
    });
    pile.on("disconnect", function() {
      console.log("CSS updater has disconnected! Refresh to reconnect");
    });
    pile.on("update", function(fileId) {
      var elem;
      elem = document.getElementById("pile-" + fileId);
      if (elem) {
        console.log("updating", fileId, elem);
        elem.href = PILE.incUrlSeq(elem.href);
      } else {
        console.log("id", fileId, "not found");
      }
    });
  };
  out.incUrlSeq = incUrlSeq;

  /*istanbul ignore else */
  if (socketio != null) {
    out.init = function(jsmanager, cssmanager, server, io) {
      var logger, _watch;
      if (!server) {
        throw new Error('LiveCSS must be bind to a http server (Express app) before it can live update CSS');
      }
      if (jsmanager.options.production) {
        logger.info('Not activating live update in production');
        return;
      }
      jsmanager.addUrl("/socket.io/socket.io.js");
      jsmanager.addOb({
        PILE: {
          incUrlSeq: incUrlSeq
        }
      });
      jsmanager.addExec(clientUpdater);
      if (io == null) {
        io = socketio.listen(server);
      }
      io.of("/pile");
      logger = jsmanager.options.logger;
      _watch = function(pile, codeOb) {
        logger.info("Watching " + (codeOb.object()) + " for changes");
        return classes.utils.fs.watch(codeOb.object(), function(type) {
          if (type === 'change') {
            logger.info('updated', codeOb.object());
            io.emit('update', codeOb.id());
          }
        });
      };
      server.on("listening", function() {
        var codeOb, k, pile, _i, _len, _ref, _ref1;
        logger.info("Activating CSS updater");
        _ref = cssmanager.piles;
        for (k in _ref) {
          pile = _ref[k];
          _ref1 = pile.code;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            codeOb = _ref1[_i];
            if (codeOb.type === 'file') {
              _watch(pile, codeOb);
            }
          }
        }
      });
    };
  } else {

    /*istanbul ignore next */
    out.init = function(jsmanager) {
      jsmanager.options.logger.error("No socket.io installed. Live update won't work.");
    };
  }
  return out;
};
