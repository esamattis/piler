module.exports = function(classes, mainExports) {
  'use strict';
  var LiveUpdateDisabled, LiveUpdateMixin, clientUpdater, debug, incUrlSeq, out, socketio;
  socketio = null;
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
  LiveUpdateMixin = (function() {
    function LiveUpdateMixin() {}

    LiveUpdateMixin.prototype.installSocketIo = function(userio) {
      var io;
      this.addUrl("/socket.io/socket.io.js");
      this.addOb({
        PILE: {
          incUrlSeq: incUrlSeq
        }
      });
      this.addExec(clientUpdater);
      if (!userio) {
        io = socketio.listen(this.server);
      } else {
        io = userio;
      }
      return this.io = io.of("/pile");
    };

    LiveUpdateMixin.prototype.liveUpdate = function(cssmanager, userio) {
      var logger;
      if (this.production) {
        this.logger.info("Not activating live update in production");
        return;
      }
      if (!this.server) {
        throw new Error('JSManager must be bind to a http server (Express app) before it can live update CSS');
      }
      this.installSocketIo(userio);
      logger = this.logger;
      return this.server.on("listening", (function(_this) {
        return function() {
          var codeOb, k, pile, _i, _len, _ref, _ref1;
          logger.info("Activating CSS updater");
          _ref = cssmanager.piles;
          for (k in _ref) {
            pile = _ref[k];
            _ref1 = pile.code;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              codeOb = _ref1[_i];
              if (codeOb.type === 'file') {
                _this._watch(pile, codeOb);
              }
            }
          }
        };
      })(this));
    };

    LiveUpdateMixin.prototype._watch = function(pile, codeOb) {
      var io, logger;
      logger = this.logger;
      io = this.io;
      logger.info("Watching " + codeOb.filePath + " for changes");
      classes.utils.fs.watch(codeOb.filePath, function(type) {
        if (type === 'change') {
          logger.info("updated", codeOb.filePath);
          io.emit("update", codeOb.getId());
        }
      });
    };

    return LiveUpdateMixin;

  })();
  out.incUrlSeq = incUrlSeq;
  if (socketio != null) {
    out.LiveUpdateMixin = LiveUpdateMixin;
  } else {

    /*istanbul ignore next */
    out.LiveUpdateMixin = LiveUpdateDisabled = (function() {
      function LiveUpdateDisabled() {}

      LiveUpdateDisabled.prototype.liveUpdate = function() {
        this.logger.error("No socket.io installed. Live update won't work.");
      };

      return LiveUpdateDisabled;

    })();
  }
  return out;
};
