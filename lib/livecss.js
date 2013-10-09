var LiveUpdateDisabled, LiveUpdateMixin, clientUpdater, fs, incUrlSeq, socketio;

fs = require("fs");

try {
  socketio = require('socket.io');
} catch (e) {
  socketio = null;
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
  return cleanUrl = cleanUrl.substr(0, cleanUrl.lastIndexOf('.')) + ("--" + (seq + 1)) + cleanUrl.substr(cleanUrl.lastIndexOf('.'));
};

clientUpdater = function() {
  var pile;
  console.log("CSS updater is active. Waiting for connection...");
  pile = io.connect('/pile');
  pile.on("connect", function() {
    return console.log("CSS updater has connected");
  });
  pile.on("disconnect", function() {
    return console.log("CSS updater has disconnected! Refresh to reconnect");
  });
  return pile.on("update", function(fileId) {
    var elem;
    elem = document.getElementById("pile-" + fileId);
    if (elem) {
      console.log("updating", fileId, elem);
      return elem.href = PILE.incUrlSeq(elem.href);
    } else {
      return console.log("id", fileId, "not found");
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
      io = socketio.listen(this.app);
    } else {
      io = userio;
    }
    io.configure(function() {
      return io.set('log level', 0);
    });
    return this.io = io.of("/pile");
  };

  LiveUpdateMixin.prototype.liveUpdate = function(cssmanager, userio, interval) {
    var listener,
      _this = this;
    if (this.production) {
      this.logger.info("Not activating live update in production");
      return;
    }
    if (!this.app) {
      throw new Error('JSManager must be bind to a http server (Express app)\
        before it can live update CSS');
    }
    this.installSocketIo(userio);
    listener = this.server ? this.server : this.app;
    return listener.on("listening", function() {
      var codeOb, k, pile, _ref, _results;
      _this.logger.info("Activating CSS updater");
      _ref = cssmanager.piles;
      _results = [];
      for (k in _ref) {
        pile = _ref[k];
        _results.push((function() {
          var _i, _len, _ref1, _results1;
          _ref1 = pile.code;
          _results1 = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            codeOb = _ref1[_i];
            _results1.push(this._watch(pile, codeOb, interval));
          }
          return _results1;
        }).call(_this));
      }
      return _results;
    });
  };

  LiveUpdateMixin.prototype._watch = function(pile, codeOb, interval) {
    var checkChange, io, last_mtime, logger,
      _this = this;
    if (codeOb.type !== "file") {
      return;
    }
    logger = this.logger;
    io = this.io;
    if (interval != null) {
      this.logger.info("watching " + codeOb.filePath + " for changes at interval " + interval);
      last_mtime = null;
      checkChange = function() {
        return fs.stat(codeOb.filePath, function(err, stat) {
          if (last_mtime === null) {
            last_mtime = stat.mtime;
          } else if (last_mtime < stat.mtime) {
            logger.info("updated", codeOb.filePath);
            io.emit("update", codeOb.getId());
            last_mtime = stat.mtime;
          }
          return setTimeout(checkChange, interval);
        });
      };
      return setTimeout(checkChange, interval);
    } else {
      this.logger.info("watching " + codeOb.filePath + " for changes");
      return fs.watch(codeOb.filePath, function() {
        _this.logger.info("updated", codeOb.filePath);
        return _this.io.emit("update", codeOb.getId());
      });
    }
  };

  return LiveUpdateMixin;

})();

LiveUpdateMixin.incUrlSeq = incUrlSeq;

if (socketio != null) {
  module.exports = LiveUpdateMixin;
} else {
  module.exports = LiveUpdateDisabled = (function() {

    function LiveUpdateDisabled() {}

    LiveUpdateDisabled.prototype.liveUpdate = function() {
      return this.logger.error("No socket.io installed. Live update won't work.");
    };

    return LiveUpdateDisabled;

  })();
}
