var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(Piler) {
  var CSSManager, CSSPile;
  CSSPile = (function(_super) {
    __extends(CSSPile, _super);


    /**
     * @member {String} ext
     * @memberof Piler.Main.CSSPile
     * @instance
     */

    CSSPile.prototype.ext = "css";


    /**
     * @constructor Piler.Main.CSSPile
     * @augments Piler.Main.BasePile
     */

    function CSSPile() {
      CSSPile.__super__.constructor.apply(this, arguments);
    }


    /**
     * Add a line comment to CSS
     *
     * @memberof Piler.Main.CSSPile
     * @param {String} line
     * @instance
     * @function commentLine
     * @returns {Piler.Main.CSSPile} `this`
     */

    CSSPile.prototype.commentLine = function(line) {
      return "/* " + (line.trim()) + " */";
    };

    return CSSPile;

  })(Piler.getPile('BasePile'));
  CSSManager = (function(_super) {
    __extends(CSSManager, _super);


    /**
     * @member {Piler.Main.CSSPile} Type
     * @memberof Piler.Main.CSSManager
     * @instance
     */

    CSSManager.prototype.type = CSSPile;


    /**
     * @member {String} contentType
     * @memberof Piler.Main.CSSManager
     * @instance
     */

    CSSManager.prototype.contentType = "text/css";


    /**
     * @constructor Piler.Main.CSSManager
     * @augments Piler.Main.PileManager
     */

    function CSSManager(name, options) {
      this.name = name;
      this.options = options;
      CSSManager.__super__.constructor.call(this, this.name, this.options);
    }


    /**
     * Wrap a stylesheet path in a link tag
     *
     * @memberof Piler.CSSManager
     * @function wrapInTag
     * @instance
     * @returns {String}
     */

    CSSManager.prototype.wrapInTag = function(uri, extra) {
      if (extra == null) {
        extra = "";
      }
      return "<link rel=\"stylesheet\" href=\"" + uri + "\" " + extra + "/>";
    };


    /**
     * @function Piler.Main.CSSManager#locals
     */

    CSSManager.prototype.locals = function(response) {
      var namespace;
      CSSManager.__super__.locals.call(this, response);
      if (!Piler.utils.objectPath.get(this, 'css.namespace')) {
        Piler.Main.debug('setting CSSManager locals');
        namespace = this.createTempNamespace();
        Piler.utils.objectPath.set(this, 'css.namespace', namespace);
      } else {
        namespace = this.css.namespace;
      }
      response.piler.css = {
        namespace: namespace,
        addRaw: this.bindToPile('addRaw', namespace),
        addFile: this.bindToPile('addFile', namespace),
        addUrl: this.bindToPile('addUrl', namespace),
        addMultiline: this.bindToPile('addMultiline', namespace)
      };
    };

    CSSManager.prototype.middleware = function() {
      return CSSManager.__super__.middleware.apply(this, arguments);
    };

    return CSSManager;

  })(Piler.getManager('PileManager'));
  Piler.addManager('css', function() {
    return CSSManager;
  });
  Piler.addPile('css', function() {
    return CSSPile;
  });
};
