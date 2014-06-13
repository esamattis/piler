#
# Don't uglify again files if they didn't change
#

fs     = require 'graceful-fs'
os     = require 'os'
path   = require 'path'
crypto = require 'crypto'

module.exports.options = options =
  enable: true
  useFS: true
  cached: (code, fnCompress) ->
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
  return options.cached(code, fnCompress) if options.enable isnt true

  if options.useFS is true
    hash = crypto.createHash('sha1').update(code).digest('hex')
    file = path.join TMPDIR, '/', hash

    # if already in cache
    return fs.readFileSync(file, {encoding: 'utf8'}) if fileExistSync(file)

    # if not: compress the code
    cache = options.cached(code, fnCompress)

    # write the file
    fs.writeFileSync(file, cache, {encoding: 'utf8'})

    # .. and return the compressed version
    cache
  else
    options.cached(code, fnCompress)