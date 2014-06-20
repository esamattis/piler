module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Serialize
  ###

  crypto = require 'crypto'
  debug = classes.utils.debug("piler:serialize")

  ###*
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   * @property {Function} id Get the code id
   * @property {Function} contents Get the contents itself
  ###

  pilers =
    raw: (ob) ->
      ob.object

    url: (ob) ->
      ob.object

    obj: (ob) ->
      toGlobals ob.object

    fn: (ob) ->
      executableFrom ob.object

    file: (ob) ->
      classes.utils.fs.readFileAsync(ob.object)
      .then((data) ->
        classes.Compilers.compile(classes.utils.extension(ob.object), ob.object, data.toString())
      )

    module: (ob) ->
      @file(ob).then((code) ->
        """require.register("#{ classes.utils.path.basename(ob.object).split(".")[0] }", function(module, exports, require) {
        #{ code }
        });"""
      )

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
      arr = []
      arr.push "#{ JSON.stringify k }: #{ codeFrom v }" for k, v of obj
      arr.join(',') + code + "}"

    _array: (array) ->
      code = "["
      arr = []
      arr.push "#{ codeFrom v }" for v in array
      arr.join(', ') + code + "]"

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

  ###*
   * Output debug messages as if it was from {@link Piler.Serialize}
   * @function Piler.Serialize.debug
  ###
  debug: debug
  serialize: do ->

    getId = ->
      sum = crypto.createHash('sha1')

      if @fromUrl
        # If code is on filesystem the url to the file should only change when
        # the path to it changes.
        sum.update @object()
      else
        # If there is no file for code code. We need to generate id from the code
        # itself.
        sum.update codeFrom @

      hash = sum.digest('hex').substring 10, 0

      if @adjustFilename and (obj = @object()) and (classes.utils._.isString(obj))
        filename = classes.utils.path.basename obj
        filename = filename.replace /\./g, "_"
        filename = filename.replace /\-/g, "_"
        hash = filename + "_" + hash

      return hash

    ->
      type = @type
      obj = @object

      @id = getId
      @object = ->
        obj
      @type = ->
        type
      @contents = (cb) ->
        classes.utils.Q.try(->
          pilers[type] @
        ).nodeify(cb)

      @

  sha1: (code, out) ->
    sha1 = crypto.createHash('sha1')
    if code
      sha1.update(code)
      if out
        return sha1.digest(out)
    sha1

  ###*
   * Add a new kind of serializable object, that should be treated differently from
   * the built-in ones
   *
   * @function Piler.Serialize.addSerializable
  ###
  addSerializable: mainExports.addSerializable = (name, factoryFn)->
    oldFn = if pilers[name] then pilers[name] else ->
    pilers[name] = factoryFn(classes)
    oldFn

  ###*
   * Generates code string from given object. Works for numbers, strings, regexes
   * and even functions. Does not handle circular references.
   * @function Piler.Serialize.stringify
  ###
  stringify: codeFrom = (obj) ->
    types[typeof obj]?(obj)