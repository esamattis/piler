var __slice = [].slice;

module.exports = function(Piler) {
  'use strict';
  var debug;
  return {

    /**
     * @namespace Piler.AssetUrlParse
     */

    /**
     * @typedef {Object} Piler.AssetUrlParse.ParseObject
     * @property {String} name Filename
     * @property {String} ext Extension
     * @property {Boolean} [min] Set to true if the parsed url is a production url
     * @property {Object} [dev] This object is set if the detected url is a development object
     * @property {String} dev.uid The hash of the asset
     * @property {String} dev.type The type of the asset
     */

    /**
     * Output debug messages as if it was from {@link Piler.AssetUrlParse}
     * @function Piler.AssetUrlParse.debug
     */
    debug: debug = Piler.utils.debug("piler:asseturlparse"),

    /**
     * Parse an URL for assets information
     *
     * @function Piler.AssetUrlParse.parse
     * @param {String} url Any valid URL or URI
     * @returns {Piler.AssetUrlParse.ParseObject}
     */
    parse: function(url) {
      var devopt, ext, filename, mode, name, ob, type, uid, __, _i, _j, _k, _ref, _ref1, _ref2, _ref3;
      if (!url) {
        return;
      }
      ob = {};
      url = Piler.utils._.first(url.split("?"));
      _ref = url.split("/"), __ = 3 <= _ref.length ? __slice.call(_ref, 0, _i = _ref.length - 2) : (_i = 0, []), mode = _ref[_i++], filename = _ref[_i++];
      if (!mode || !filename) {
        return;
      }
      debug('asset', url, mode, filename);
      if (mode === "dev") {
        _ref1 = filename.split("."), __ = 4 <= _ref1.length ? __slice.call(_ref1, 0, _j = _ref1.length - 3) : (_j = 0, []), name = _ref1[_j++], devopt = _ref1[_j++], ext = _ref1[_j++];
        if (!name || !devopt || !ext) {
          return;
        }
        _ref2 = devopt.split("-"), type = _ref2[0], uid = _ref2[1];
        debug('parsing in dev mode', url, type, uid);
        ob.dev = {
          uid: uid,
          type: type
        };
      } else {
        _ref3 = filename.split("."), __ = 3 <= _ref3.length ? __slice.call(_ref3, 0, _k = _ref3.length - 2) : (_k = 0, []), name = _ref3[_k++], ext = _ref3[_k++];
        if (!name || !ext) {
          return;
        }
        debug('parsing in prod mode', url, name, ext);
        ob.min = true;
      }
      ob.name = name;
      ob.ext = ext;
      return ob;
    }
  };
};
