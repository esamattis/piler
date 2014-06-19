var file, files;

files = {
  utils: {
    _: require('lodash'),
    path: require('path'),
    fs: require('graceful-fs'),
    Q: require('bluebird'),
    debug: require('debug'),
    reserved: require('reserved'),
    extension: function(filename) {
      var parts;
      parts = filename.split(".");
      return parts[parts.length - 1];
    }
  },
  AssetUrlParse: require('./asseturlparse'),
  Minify: require('./minify'),
  Cache: require('./cache'),
  LiveCSS: require('./livecss'),
  Piler: require('./piler'),
  Logger: require('./logger'),
  Serialize: require('./serialize'),
  Compilers: require('./compilers')
};

module.exports = files;

files.utils._.mixin(require('underscore.string'));

for (file in files) {
  if (file !== 'utils') {
    files[file] = files[file](files, module.exports);
  }
}
