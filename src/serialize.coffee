'use strict'

crypto = require 'crypto'
compilers = require('./compilers')
debug = require("debug")("piler:serialize")
path = require "path"
fs = require "graceful-fs"

extension = (filename) ->
  parts = filename.split "."
  parts[parts.length-1]

# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"

toGlobals = (globals) ->
  code = ""
  for nsString, v of globals
    code += "__SET(#{ JSON.stringify nsString }, #{ codeFrom v });\n"
  code

module.exports = do ->

  getId = ->
    sum = crypto.createHash('sha1')

    if @type is "file"
      # If code is on filesystem the url to the file should only change when
      # the path to it changes.
      sum.update @filePath
    else
      # If there is no file for code code. We need to generate id from the code
      # itself.
      sum.update codeFrom @

    hash = sum.digest('hex').substring 10, 0

    if @type in ["file", "module"]
      filename = path.basename @filePath
      filename = filename.replace /\./g, "_"
      filename = filename.replace /\-/g, "_"
      hash = filename + "_" + hash

    return hash

  ->
    @getId = getId
    @getCode = (cb) ->
      pilers[@type] @, cb

    @

module.exports.pilers = pilers =
    raw: (ob, cb) ->
      cb null, ob.raw
      return

    object: (ob, cb) ->
      cb null, toGlobals ob.object
      return

    exec: (ob, cb) ->
      cb null, executableFrom ob.object
      return

    file: (ob, cb) ->
      fs.readFile ob.filePath, (err, data) ->
        return cb? err if err
        compilers.compile(extension(ob.filePath), data.toString(), (err, code) ->
          cb err, code
        )
        return

      return

    module: (ob, cb) ->
      this.file ob, (err, code) ->
        return cb? err if err
        cb null, """require.register("#{ path.basename(ob.filePath).split(".")[0] }", function(module, exports, require) {
        #{ code }
        });"""
        return
      return

module.exports.sha1 = (code, out) ->
  sha1 = crypto.createHash('sha1')
  if code
    sha1.update(code)
    if out
      return sha1.digest(out)
  sha1

# Remove last comma from string
removeTrailingComma = (s) ->
  s.trim().replace(/,$/, "")

# Map of functions that can convert various Javascript objects to strings.
types =

  function: (fn) -> "#{ fn }"
  string: (s) -> JSON.stringify s # Knows how to correctly serialize strings to String literals
  number: (n) -> n.toString()
  boolean: (n) -> n.toString()

  object: (obj) ->

    # typeof reports array as object
    return @_array obj if Array.isArray obj

    code = "{"
    for k, v of obj
      code += "\"#{ k }\": #{ codeFrom(v) },"

    "#{removeTrailingComma(code)} }"

  _array: (array) ->
    code = "["
    code += " #{ codeFrom v },"  for v in array
    removeTrailingComma(code) + "]"


# Generates code string from given object. Works for numbers, strings, regexes
# and even functions. Does not handle circular references.
module.exports.stringify = codeFrom = (obj) ->
  types[typeof obj]?(obj)