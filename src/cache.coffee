#
# Don't uglify again files if they didn't change
#

fs     = require 'graceful-fs'
os     = require 'os'
path   = require 'path'
crypto = require 'crypto'
debug  = require('debug')('piler:cache')

module.exports.options = options =
  enable: true
  useFS: true
  cached: (code, hash, fnCompress) ->
    fnCompress()

# e.g. /var/folders/zm/jmjb49l172g6g_h1y8701spc0000gn/T/
TMPDIR = os.tmpDir()

fileExistSync = (filePath) ->
  try
    fs.statSync(filePath)
  catch err
    if err.code == 'ENOENT'
      return false
  return true

# Return a compressed version (already cached or not) of `code`, this function is synchronous
module.exports = (code, fnCompress) ->
  if options.enable isnt true
    debug('minify cache isnt enabled')
    return options.cached(code, fnCompress)

  hash = crypto.createHash('sha1').update(code).digest('hex')

  if options.useFS is true
    file = path.join TMPDIR, '/', hash

    debug('using filesystem.', 'hash:', hash, 'file:', file)

    if fileExistSync(file)
      debug('file already in cache')
      # if already in cache
      return fs.readFileSync(file, {encoding: 'utf8'})

    # if not: compress the code
    cache = options.cached(code, hash, fnCompress)

    # write the file
    fs.writeFileSync(file, cache, {encoding: 'utf8'})

    # .. and return the compressed version
    cache
  else
    debug('not using file system. calling custom callback.', 'hash:', hash)
    options.cached(code, hash, fnCompress)