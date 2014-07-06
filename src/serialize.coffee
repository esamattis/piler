module.exports = (Piler, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Serialize
  ###

  crypto = require('crypto')
  debug = Piler.utils.debug('piler:serialize')

  ###*
   * @typedef {Function} Piler.Serialize.Serializable
   * @param {Piler.Serialize.CodeObject} ob Receives the code object
  ###
  ###*
   * Serializable callback
   *
   * @example
   *   function(callback) {
   *     // do some transformation then return
   *   }
   *
   * @callback Piler.Serialize.Callback
   *
   * @param {Piler.Serialize.CodeObject} ob The current object
   * @returns {Promise|String|Number|Boolean|Function}
  ###
  ###*
   * A code object
   *
   * @typedef {Object} Piler.Serialize.CodeObjectOptions
   * @property {Boolean} [before=false] Prepend into the pile
   * @property {Boolean} [asIs=false] Wrap the tag using the {@link Piler.Serialize.CodeObject.raw() CodeObject.raw()} instead of the {@link Piler.Serialize.CodeObject.contents()}
   * @property {String|null} [filePath=null] Assign that object is a filepath
   * @property {String|null} [hashFrom=null] Create the hash from a member of the object instead
   * @property {*} [extra=null] Extra information to pass to the wrapInTag function
  ###
  ###*
   * A code object, that is an agnostic asset
   *
   * @typedef {Object} Piler.Serialize.CodeObject
   *
   * @property {Function} id Get the code id
   * @property {Function} raw Get the unaltered content
   * @property {Function} type Get the registered type
   * @property {Function} toString Serialized object from raw
   * @property {Function} contents Get the contents itself
   * @property {Piler.Serialize.CodeObjectOptions} options Get the registered type
  ###

  serializables = {
    raw: (ob) ->
      ob.raw()

    url: (ob) ->
      ob.raw()

    multiline: (ob)->
      Piler.utils.multiline(ob.raw())

    file: (ob) ->
      Piler.utils.fs.readFileAsync(ob.raw())
      .then((data) ->
        data.toString()
      )
  }

  # Map of functions that can convert various Javascript objects to strings.
  types = {
    function: (fn) -> "#{ fn }"

    # Knows how to correctly serialize strings to String literals
    string: (s) -> JSON.stringify(s)

    number: (n) -> n.toString()

    boolean: (n) -> n.toString()

    object: (obj) ->

      # typeof reports array as object
      return @_array(obj) if Array.isArray(obj)

      arr = []
      arr.push("#{ JSON.stringify(k) }: #{ codeFrom(v) }") for k, v of obj
      '{' + arr.join(',') + '}'

    _array: (array) ->
      arr = []
      arr.push("#{ codeFrom(v) }") for v in array
      '[' + arr.join(',') + ']'
  }

  {
    ###*
     * Output debug messages as if it was from {@link Piler.Serialize}
     * @function Piler.Serialize.debug
    ###
    debug: debug
    serialize: do ->

      getId = ->
        if not @options.name
          sum = crypto.createHash('sha1')

          if @options.hashFrom
            # If code is on filesystem the url to the file should only change when
            # the path to it changes.
            sum.update(do =>
              f = Piler.utils.objectPath.get(@, @options.hashFrom)

              if Piler.utils._.isFunction(f)
                f = f()

              if typeof f isnt 'string' then codeFrom(f) else f
            )
          else
            # If there is no file for code code. We need to generate id from the code
            # itself.
            sum.update(codeFrom([@raw(), @options, @type()]))

          hash = sum.digest('hex').substring(12, 0)

          if @options.filePath
            filename = Piler.utils.path.basename(@options.filePath)
            filename = filename.replace(/[^a-zA-Z0-9]+/g, '_')
            hash = "#{filename}_#{hash}"
        else
          hash = @options.name

          if @options.filePath
            hash = "#{Piler.utils.path.basename(@options.filePath)}_#{hash}"

          hash = hash.replace(/[^a-zA-Z0-9]+/g, '_')

        return hash

      ->
        throw new Error('This object was already serialized') if typeof @id is 'function'

        type = @type
        raw = @raw
        self = @

        defaults(@)

        @id = getId

        @raw = ->
          raw

        @toString = ->
          codeFrom(raw)

        @type = ->
          type

        @contents = (cb) ->
          Piler.utils.Promise.try(->
            serializables[type](self)
          ).bind(@).nodeify(cb)

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
     * @example
     *   Piler.addSerializable('name', function(Piler){
     *     return function(ob){
     *       return  // do something with ob;
     *     };
     *   });
     *
     * @function Piler.Serialize.addSerializable
     * @oaran {String} name
     * @param {Piler.FactoryFn} factoryFn
     * @returns {Piler.Serialize.Serializable|null}
    ###
    addSerializable: mainExports.addSerializable = (name, factoryFn)->
      oldFn = if serializables[name]
        debug('Overwriting', name)
        serializables[name]
      else
        null

      debug('Added', name)
      serializables[name] = factoryFn(Piler)
      oldFn

    ###*
     * Generates code string from given object. Works for numbers, strings, regexes
     * and even functions. Does not handle circular references.
     *
     * @function Piler.Serialize.stringify
    ###
    stringify: codeFrom = (obj) ->
      types[typeof obj]?(obj)

    ###*
     * Place the defaults options on the object
     *
     * @example
     *   var obj = {};
     *   Piler.Serialize.defaults(obj);
     *   obj = {
     *     options: {
     *       // default CodeObject options
     *     }
     *   };
     *
     * @function Piler.Serialize.defaults
     * @param  {Object} obj Object to receive defaults
     * @returns {Object}
    ###
    defaults: defaults = (obj) ->
      Piler.utils.objectPath.ensureExists(obj, 'options', {})

      Piler.utils._.defaults(obj.options, {
        filePath: null
        asIs: false
        hashFrom: null
        before: false
        extra: null
        processors: {}
      })

      obj
  }