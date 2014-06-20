module.exports = (classes, mainExports) ->
  'use strict'

  ###*
   * @namespace Piler.Logger
  ###

  # Basic Logger functionality
  ###*
   * Output debug information
   * @function Piler.Logger.debug
   * @param {...*} [any]
  ###
  debug    : console.debug
  ###*
   * Output notice information
   * @function Piler.Logger.notice
   * @param {...*} [any]
  ###
  notice   : console.log
  ###*
   * Output info information
   * @function Piler.Logger.info
   * @param {...*} [any]
  ###
  info     : console.info
  ###*
   * Output warn information
   * @function Piler.Logger.warn
   * @param {...*} [any]
  ###
  warn     : console.warn
  ###*
   * Output warning information
   * @function Piler.Logger.warning
   * @param {...*} [any]
  ###
  warning  : console.warn
  ###*
   * Output error information
   * @function Piler.Logger.error
   * @param {...*} [any]
  ###
  error    : console.error
  ###*
   * Output critical information
   * @function Piler.Logger.critical
   * @param {...*} [any]
  ###
  critical : console.error