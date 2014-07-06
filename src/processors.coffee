module.exports = (Piler, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Processors
  ###

  out = {
    ###*
     * Output debug messages as if it was from {@link Piler.Processors}
     * @function Piler.Processors.debug
    ###
    debug: debug = Piler.utils.debug('piler:processors')
  }

  ###*
   * Process the code
   *
   * @typedef {Function} Piler.Processors.Render
   *
   * @param {String} code
   * @param {Piler.Serialize.CodeObject} [asset]
   * @param {Object} [options={}]
   *
   * @returns {Promise|String} Can return either a promise or a string
  ###
  ###*
   * A function that checks whether this processor should run or not
   *
   * @callback Piler.Processors.Condition
   *
   * @example
   *   {
   *     condition: function(asset, options){
   *       return asset.options.filePath && asset.options.filePath.indexOf('.sillyext') > -1;
   *     }
   *   }
   *
   * @param {Piler.Serialize.CodeObject} asset The current asset in the bunch
   * @param {Object} [options={}] Temporary options passed to the processor
   * @returns {Boolean} Return true or false if this should run or not
  ###

  ###*
   * The anatomy of a processor
   *
   * @typedef {Object} Piler.Processors.Processor
   *
   * @property {Object} [pre]
   * @property {Piler.Processors.Render} pre.render
   * @property {Piler.Processors.Condition} [pre.condition]
   * @property {Object} [pre.defaults]
   *
   * @property {Object} [post]
   * @property {Piler.Processors.Render} post.render
   * @property {Piler.Processors.Condition} [post.condition]
   * @property {Object} [post.defaults]
  ###

  processors = {}

  ###*
   * @function Piler.process
  ###
  ###*
   * Process raw code. Doesn't apply any stage options, you must specify it yourself
   *
   * @example
   *    Piler.process('coffeescript', '-> @').done(function(code){
   *      console.log(code);
   *    });
   *
   * @function Piler.Processors.process
   * @param {String} name Name of the processor
   * @param {String|null} code String code to process
   * @param {Piler.Serialize.CodeObject} [asset] A code object
   * @param {Object} [options] Temporary options to pass to this process
   * @param {Array|String} [stages=['pre','post']] 'pre' or 'post' stages
   * @param {Piler.NodeCallback} [cb] Optional callback
   * @returns {Promise}
  ###
  out.process = mainExports.process = (name, code, asset, options, stages, cb) ->
    throw new Error("Processor '#{name}' not found") if not name or not processors[name]
    throw new Error("Missing code or asset for '#{name}'") if not code and not asset

    if (not asset) or (not Piler.utils._.isObject(asset)) or (not Piler.utils._.size(asset))
      asset = {
        type: 'raw'
        raw: code
      }
      asset = Piler.Serialize.serialize.call(asset)
      asset.options.processors[name] = {}

    if (not Piler.utils._.isArray(stages)) and (not Piler.utils._.isString(stages))
      stages = ['pre','post']
    else if Piler.utils._.isArray(stages) and (not stages.length)
      stages = ['pre','post']

    stages = Piler.utils.ensureArray(stages)

    debug("Processing code with '#{name}' on stages", stages)

    if not code and asset
      result = asset.contents()
    else
      result = Piler.utils.Promise.resolve(code)

    for stage in ['pre','post']
      continue if not Piler.utils._.contains(stages, stage)

      result = result.then(do (stage) ->
        (code) ->
          processor = Piler.utils.objectPath.get(processors, [name, stage])

          if processor and processor.render
            opts = Piler.utils._.merge({}, Piler.utils.objectPath.get(processor, ['defaults'], {}), options)

            debug("#{stage}processing", asset.id(), "using '#{name}' with options", opts)

            if opts.force is true
              condition = Piler.utils.Promise.resolve(true)
              delete opts.force
            else if (assetopt = Piler.utils.objectPath.get(asset, ['options', 'processors', name]))
              opts = Piler.utils._.merge({}, opts, assetopt)
              condition = Piler.utils.Promise.resolve(true)
            else
              condition = processor.condition(asset, opts)

            condition.bind({
              opts: opts
              asset: asset
            }).then(
              (condition) ->
                if condition is true
                  processor.render(
                    code
                    @asset
                    @opts
                  )
                else
                  debug('Condition is false, skipping')
                  # pass unchanged code to the next then
                  code
              (err) ->
                # error occurred
                debug('Processing error', err)
                throw err
            )
          else
            debug('Stage',"'#{stage}'", "not defined for '#{name}', skipping")
            code
      )

    result.nodeify(cb)

  ###*
   * @function Piler.addProcessor
  ###
  ###*
   * Add a processor to Piler. You can override existing processors using this.
   *
   * @example
   *   Piler.addProcessor('name', function(Piler){
   *     return {
   *       pre: {
   *         render: function(code, asset, options){
   *           // do your thing.
   *           //
   *           // you can return synchronously or can return a promise
   *           // you can
   *           //
   *           // new Piler.utils.Promise(function(resolve, reject){})
   *           //
   *           // to create a promise as well
   *           //
   *           // You can also throw errors safely in here
   *           return code;
   *         },
   *         // default options
   *         defaults: { },
   *         // should this process stage be applied conditionally? you can return a promise in here
   *         condition: function(asset, options) {
   *           return true;
   *         }
   *       },
   *     };
   *   });
   *
   * @function Piler.Processors.addProcessor
   *
   * @throws Error
   * @param {String} name The name of the processor
   * @param {Piler.FactoryFn} factoryFn The function that will be factory for generating code that returns a {@link Piler.Processors.Processor}
   * @returns {Piler.Processors.Processor}
  ###
  out.addProcessor = mainExports.addProcessor = (name, factoryFn) ->
    throw new Error('Missing name for processor') if not name
    throw new Error('addProcessor expects a function as second parameter for ') if not Piler.utils._.isFunction(factoryFn)

    def = factoryFn(Piler)

    throw new Error("Factory result for '#{name}' must be an object") if not Piler.utils._.isObject(def)

    ###istanbul ignore next###
    retTrue = -> true

    if (render = Piler.utils.objectPath.get(def, ['post','render']))
      def.post.render = Piler.utils.Promise.method(def.post.render)
      Piler.utils.objectPath.ensureExists(def.post, 'condition', retTrue)
      def.post.condition = Piler.utils.Promise.method(def.post.condition)

    if (render = Piler.utils.objectPath.get(def, ['pre','render']))
      def.pre.render = Piler.utils.Promise.method(def.pre.render)
      Piler.utils.objectPath.ensureExists(def.pre, 'condition', retTrue)
      def.pre.condition = Piler.utils.Promise.method(def.pre.condition)

    debug('Added', name, Object.keys(def))

    if processors[name]
      debug('Overwritting existing processor', name)

    processors[name] = def

  ###*
   * Get the processor object
   *
   * @function Piler.Processors.getProcessor
   * @param {String} name Name of processor
   * @return {Piler.Processors.Processor}
  ###
  out.getProcessor = mainExports.getProcessor = (name) ->
    processors[name]

  ###*
   * @function Piler.removeProcessor
  ###
  ###*
   * @function Piler.Processors.removeProcessor
   * @param {String} name Name to remove
  ###
  out.removeProcessor = mainExports.removeProcessor = (name) ->
    ###istanbul ignore else###
    if processors[name]
      delete processors[name]

    return

  out