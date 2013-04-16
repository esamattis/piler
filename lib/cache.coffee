#
# Don't uglify again files if they didn't change
#

fs     = require 'fs'
os     = require 'os'
crypto = require 'crypto'

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
  hash = crypto.createHash('sha1').update(code).digest('hex')
  file = TMPDIR+'/'+hash

  # if already in cache
  return fs.readFileSync(file, 'utf8') if fileExistSync(file)

  # if not: compress the code
  cache = fnCompress()

  # write the file
  fs.writeFileSync(file, cache, 'utf8')

  # .. and return the compressed version
  cache
