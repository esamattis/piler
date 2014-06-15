'use strict';
var LiveUpdateDisabled, LiveUpdateMixin, clientUpdater, e, fs, incUrlSeq, socketio;

fs = require("graceful-fs");

try {
  socketio = require('socket.io');
} catch (_error) {
  e = _error;
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
  return cleanUrl.substr(0, cleanUrl.lastIndexOf('.')) + ("--" + (seq + 1)) + cleanUrl.substr(cleanUrl.lastIndexOf('.'));
};

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
    if (this.production) {
      this.logger.info("Not activating live update in production");
      return;
    }
    if (!this.server) {
      throw new Error('JSManager must be bind to a http server (Express app) before it can live update CSS');
    }
    this.installSocketIo(userio);
    return this.server.on("listening", (function(_this) {
      return function() {
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
              _results1.push(this._watch(pile, codeOb));
            }
            return _results1;
          }).call(_this));
        }
        return _results;
      };
    })(this));
  };

  LiveUpdateMixin.prototype._watch = function(pile, codeOb) {
    if (codeOb.type !== "file") {
      return;
    }
    this.logger.info("watching " + codeOb.filePath + " for changes");
    fs.watch(codeOb.filePath, (function(_this) {
      return function(type) {
        if (type === 'change') {
          _this.logger.info("updated", codeOb.filePath);
          _this.io.emit("update", codeOb.getId());
        }
      };
    })(this));
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
      this.logger.error("No socket.io installed. Live update won't work.");
    };

    return LiveUpdateDisabled;

  })();
}
