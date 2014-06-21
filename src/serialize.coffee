module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Serialize
  ###

  crypto = require 'crypto'
  debug = classes.utils.debug("piler:serialize")

  ###*
   * Serializable callback
   *
   * @callback Piler.Serialize.Callback
   * @param {Piler.Serialize.CodeObject} ob The current object
   * @returns {Promise|String|Number|Boolean|Function}
  ###
  ###*
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   * @property {Function} id Get the code id
   * @property {Piler.Serialize.Callback} contents Get the contents itself
   * @property {Function} object Get the registered object
   * @property {Function} type Get the registered type
  ###

  pilers =
    raw: (ob) ->
      ob.object()

    url: (ob) ->
      ob.object()

    multiline: (ob)->
      classes.utils.multiline ob.object()

    file: (ob) ->
      classes.utils.fs.readFileAsync(ob.object())
      .then (data) ->
        data.toString()

  # Map of functions that can convert various Javascript objects to strings.
  types =

    function: (fn) -> "#{ fn }"
    string: (s) -> JSON.stringify s # Knows how to correctly serialize strings to String literals
    number: (n) -> n.toString()
    boolean: (n) -> n.toString()

    object: (obj) ->

      # typeof reports array as object
      return @_array obj if Array.isArray obj

      arr = []
      arr.push "#{ JSON.stringify k }: #{ codeFrom v }" for k, v of obj
      "{" + arr.join(',') + "}"

    _array: (array) ->
      arr = []
      arr.push "#{ codeFrom v }" for v in array
      "[" + arr.join(', ') + "]"

  ###*
   * Output debug messages as if it was from {@link Piler.Serialize}
   * @function Piler.Serialize.debug
  ###
  debug: debug
  serialize: do ->

    getId = ->
      sum = crypto.createHash('sha1')

      if @options.noSumContent
        # If code is on filesystem the url to the file should only change when
        # the path to it changes.
        sum.update @object()
      else
        # If there is no file for code code. We need to generate id from the code
        # itself.
        sum.update codeFrom [@object(), @options, @type()]

      hash = sum.digest('hex').substring 10, 0

      if @options.filePath
        filename = classes.utils.path.basename @object()
        filename = filename.replace /\./g, "_"
        filename = filename.replace /\-/g, "_"
        hash = filename + "_" + hash

      return hash

    ->
      type = @type
      obj = @object
      self = @

      @id = getId

      @object = ->
        obj

      @type = ->
        type

      @contents = (cb) ->
        classes.utils.Q.try(->
          pilers[type] self
        ).nodeify(cb)

      @

  ###*
   * Creates a SHA1 from string
   *
   * @function Piler.Serializable.sha1
   * @param {String} code
   * @param {String} [out] Digest
   * @returns {crypto.Hash}
  ###
  sha1: (code, out) ->
    sha1 = crypto.createHash('sha1')
    if code
      sha1.update(code)
      if out
        return sha1.digest(out)
    sha1

  ###*
   * @function Piler.addSerializable
  ###
  ###*
   * Add a new kind of serializable object, that should be treated differently from
   * the built-in ones. Methods returned by the factory are bound to each {@link Piler.Serialize.CodeObject}
   *
   * @function Piler.Serialize.addSerializable
  ###
  addSerializable: mainExports.addSerializable = (name, factoryFn)->
    oldFn = if pilers[name] then pilers[name] else ->
    debug('Added', name)
    pilers[name] = factoryFn(classes)
    oldFn

  ###*
   * Generates code string from given object. Works for numbers, strings, regexes
   * and even functions. Does not handle circular references.
   * @function Piler.Serialize.stringify
  ###
  stringify: codeFrom = (obj) ->
    types[typeof obj]?(obj)