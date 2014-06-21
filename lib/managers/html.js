var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(Piler) {
  var HTMLManager, HTMLPile;
  HTMLPile = (function(_super) {
    __extends(HTMLPile, _super);


    /**
     * @member {String} Piler.Main.HTMLPile#ext
     * @default html
     */

    HTMLPile.prototype.ext = "html";


    /**
     * Add line comment
     *
     * @function Piler.Main.HTMLPile#commentLine
     * @returns {String}
     * @instance
     */

    HTMLPile.prototype.commentLine = function(line) {
      return "<!-- " + (line.trim()) + " -->";
    };


    /**
     * @augments Piler.Main.BasePile
     * @constructor Piler.Main.HTMLPile
     */

    function HTMLPile() {
      HTMLPile.__super__.constructor.apply(this, arguments);
    }

    return HTMLPile;

  })(Piler.getPile('BasePile'));
  HTMLManager = (function(_super) {
    __extends(HTMLManager, _super);


    /**
     * @member {Piler.Main.HTMLPile} Piler.Main.HTMLManager#type
     */

    HTMLManager.prototype.type = HTMLPile;


    /**
     * @member {String} Piler.Main.HTMLManager#contentType
     */

    HTMLManager.prototype.contentType = "text/html";


    /**
     * @constructor Piler.Main.HTMLManager
     * @augments Piler.Main.PileManager
     */

    function HTMLManager() {
      HTMLManager.__super__.constructor.apply(this, arguments);
      return;
    }


    /**
     * @function Piler.Main.HTMLManager#setMiddleware
     * @returns {Piler.Main.HTMLManager} `this`
     */

    HTMLManager.prototype.locals = function(response) {
      HTMLManager.__super__.locals.call(this, response);
      Piler.Main.debug('setting HTMLManager locals');
      response.piler.html = {
        addExec: this.bindToPile('addExec'),
        addRaw: this.bindToPile('addRaw'),
        addOb: this.bindToPile('addOb'),
        addModule: this.bindToPile('addModule'),
        addFile: this.bindToPile('addFile'),
        addUrl: this.bindToPile('addUrl')
      };
      return this;
    };

    HTMLManager.prototype.middleware = function() {
      return HTMLManager.__super__.middleware.apply(this, arguments);
    };

    return HTMLManager;

  })(Piler.getManager('PileManager'));
  Piler.addManager('html', function() {
    return HTMLManager;
  });
  Piler.addPile('html', function() {
    return HTMLPile;
  });
};
