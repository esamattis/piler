module.exports = function(Piler, mainExports) {
  'use strict';

  /**
   * @namespace Piler.Processors
   */
  var debug, out, processors;
  out = {

    /**
     * Output debug messages as if it was from {@link Piler.Processors}
     * @function Piler.Processors.debug
     */
    debug: debug = Piler.utils.debug('piler:processors')
  };

  /**
   * Process the code
   *
   * @typedef {Function} Piler.Processors.Render
   *
   * @param {String} code
   * @param {Piler.Serialize.CodeObject} [asset]
   * @param {Object} [options={}]
   *
   * @returns {Promise|String} Can return either a promise or a string
   */

  /**
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
   */

  /**
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
   */
  processors = {};

  /**
   * @function Piler.process
   */

  /**
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
   */
  out.process = mainExports.process = function(name, code, asset, options, stages, cb) {
    var result, stage, _i, _len, _ref;
    if (!name || !processors[name]) {
      throw new Error("Processor '" + name + "' not found");
    }
    if (!code && !asset) {
      throw new Error("Missing code or asset for '" + name + "'");
    }
    if ((!asset) || (!Piler.utils._.isObject(asset)) || (!Piler.utils._.size(asset))) {
      asset = {
        type: 'raw',
        raw: code
      };
      asset = Piler.Serialize.serialize.call(asset);
      asset.options.processors[name] = {};
    }
    if ((!Piler.utils._.isArray(stages)) && (!Piler.utils._.isString(stages))) {
      stages = ['pre', 'post'];
    } else if (Piler.utils._.isArray(stages) && (!stages.length)) {
      stages = ['pre', 'post'];
    }
    stages = Piler.utils.ensureArray(stages);
    debug("Processing code with '" + name + "' on stages", stages);
    if (!code && asset) {
      result = asset.contents();
    } else {
      result = Piler.utils.Promise.resolve(code);
    }
    _ref = ['pre', 'post'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      stage = _ref[_i];
      if (!Piler.utils._.contains(stages, stage)) {
        continue;
      }
      result = result.then((function(stage) {
        return function(code) {
          var assetopt, condition, opts, processor;
          processor = Piler.utils.objectPath.get(processors, [name, stage]);
          if (processor && processor.render) {
            opts = Piler.utils._.merge({}, Piler.utils.objectPath.get(processor, ['defaults'], {}), options);
            debug("" + stage + "processing", asset.id(), "using '" + name + "' with options", opts);
            if (opts.force === true) {
              condition = Piler.utils.Promise.resolve(true);
              delete opts.force;
            } else if ((assetopt = Piler.utils.objectPath.get(asset, ['options', 'processors', name]))) {
              opts = Piler.utils._.merge({}, opts, assetopt);
              condition = Piler.utils.Promise.resolve(true);
            } else {
              condition = processor.condition(asset, opts);
            }
            return condition.bind({
              opts: opts,
              asset: asset
            }).then(function(condition) {
              if (condition === true) {
                return processor.render(code, this.asset, this.opts);
              } else {
                debug('Condition is false, skipping');
                return code;
              }
            }, function(err) {
              debug('Processing error', err);
              throw err;
            });
          } else {
            debug('Stage', "'" + stage + "'", "not defined for '" + name + "', skipping");
            return code;
          }
        };
      })(stage));
    }
    return result.nodeify(cb);
  };

  /**
   * @function Piler.addProcessor
   */

  /**
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
   */
  out.addProcessor = mainExports.addProcessor = function(name, factoryFn) {
    var def, render, retTrue;
    if (!name) {
      throw new Error('Missing name for processor');
    }
    if (!Piler.utils._.isFunction(factoryFn)) {
      throw new Error('addProcessor expects a function as second parameter for ');
    }
    def = factoryFn(Piler);
    if (!Piler.utils._.isObject(def)) {
      throw new Error("Factory result for '" + name + "' must be an object");
    }

    /*istanbul ignore next */
    retTrue = function() {
      return true;
    };
    if ((render = Piler.utils.objectPath.get(def, ['post', 'render']))) {
      def.post.render = Piler.utils.Promise.method(def.post.render);
      Piler.utils.objectPath.ensureExists(def.post, 'condition', retTrue);
      def.post.condition = Piler.utils.Promise.method(def.post.condition);
    }
    if ((render = Piler.utils.objectPath.get(def, ['pre', 'render']))) {
      def.pre.render = Piler.utils.Promise.method(def.pre.render);
      Piler.utils.objectPath.ensureExists(def.pre, 'condition', retTrue);
      def.pre.condition = Piler.utils.Promise.method(def.pre.condition);
    }
    debug('Added', name, Object.keys(def));
    if (processors[name]) {
      debug('Overwritting existing processor', name);
    }
    return processors[name] = def;
  };

  /**
   * Get the processor object
   *
   * @function Piler.Processors.getProcessor
   * @param {String} name Name of processor
   * @return {Piler.Processors.Processor}
   */
  out.getProcessor = mainExports.getProcessor = function(name) {
    return processors[name];
  };

  /**
   * @function Piler.removeProcessor
   */

  /**
   * @function Piler.Processors.removeProcessor
   * @param {String} name Name to remove
   */
  out.removeProcessor = mainExports.removeProcessor = function(name) {

    /*istanbul ignore else */
    if (processors[name]) {
      delete processors[name];
    }
  };
  return out;
};
