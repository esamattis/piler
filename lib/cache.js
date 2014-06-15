var TMPDIR, crypto, debug, fileExistSync, fs, options, os, path;

fs = require('graceful-fs');

os = require('os');

path = require('path');

crypto = require('crypto');

debug = require('debug')('piler:cache');

TMPDIR = os.tmpDir();

fileExistSync = function(filePath) {
  var err;
  try {
    fs.statSync(filePath);
  } catch (_error) {
    err = _error;
    if (err.code === 'ENOENT') {
      return false;
    }
  }
  return true;
};

module.exports = function(code, fnCompress) {
  var cache, file, hash;
  if (options.enable !== true) {
    debug('minified code cache isnt enabled');
    return fnCompress();
  }
  hash = crypto.createHash('sha1').update(code).digest('hex');
  if (options.useFS === true) {
    file = path.join(TMPDIR, '/', hash);
    debug('using filesystem.', 'hash:', hash, 'file:', file);
    if (fileExistSync(file)) {
      debug('file already in cache');
      return fs.readFileSync(file, {
        encoding: 'utf8'
      });
    }
    cache = options.cacheCallback(code, hash, fnCompress);
    fs.writeFileSync(file, cache, {
      encoding: 'utf8'
    });
    return cache;
  } else {
    debug('not using file system. calling custom callback.', 'hash:', hash);
    return options.cacheCallback(code, hash, fnCompress);
  }
};

module.exports.options = options = {
  enable: true,
  useFS: true,
  cacheCallback: function(code, hash, fnCompress) {
    console.log('asdfdsa');
    return fnCompress();
  }
};
