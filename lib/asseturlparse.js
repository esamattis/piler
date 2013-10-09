var p, _,
  __slice = [].slice;

_ = require('underscore');

_.mixin(require('underscore.string'));

module.exports = p = function(url) {
  var cachekey, devopt, ext, filename, mode, name, ob, type, uid, __, _i, _j, _k, _ref, _ref1, _ref2, _ref3;
  ob = {};
  url = _.first(url.split("?"));
  _ref = url.split("/"), __ = 4 <= _ref.length ? __slice.call(_ref, 0, _i = _ref.length - 3) : (_i = 0, []), mode = _ref[_i++], cachekey = _ref[_i++], filename = _ref[_i++];
  if (mode === "dev") {
    _ref1 = filename.split("."), __ = 4 <= _ref1.length ? __slice.call(_ref1, 0, _j = _ref1.length - 3) : (_j = 0, []), name = _ref1[_j++], devopt = _ref1[_j++], ext = _ref1[_j++];
    _ref2 = devopt.split("-"), type = _ref2[0], uid = _ref2[1];
    ob.dev = {
      uid: uid,
      type: type
    };
  } else {
    _ref3 = filename.split("."), __ = 3 <= _ref3.length ? __slice.call(_ref3, 0, _k = _ref3.length - 2) : (_k = 0, []), name = _ref3[_k++], ext = _ref3[_k++];
    ob.min = true;
  }
  ob.name = name;
  ob.ext = ext;
  return ob;
};

if (require.main === module) {
  console.info(p("/pile/dev/my.exec-123.js"));
}
