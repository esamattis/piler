var TMPDIR, crypto, fileExistSync, fs, options, os, path;

fs = require('graceful-fs');

os = require('os');

path = require('path');

crypto = require('crypto');

module.exports.options = options = {
  enable: true,
  useFS: true,
  cached: function(code, fnCompress) {
    return fnCompress();
  }
};

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
    return options.cached(code, fnCompress);
  }
  if (options.useFS === true) {
    hash = crypto.createHash('sha1').update(code).digest('hex');
    file = path.join(TMPDIR, '/', hash);
    if (fileExistSync(file)) {
      return fs.readFileSync(file, {
        encoding: 'utf8'
      });
    }
    cache = options.cached(code, fnCompress);
    fs.writeFileSync(file, cache, {
      encoding: 'utf8'
    });
    return cache;
  } else {
    return options.cached(code, fnCompress);
  }
};
