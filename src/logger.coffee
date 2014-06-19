module.exports = (classes, mainExports) ->
  'use strict'

  # Basic Logger functionality
  debug    : console.debug
  notice   : console.log
  info     : console.info
  warn     : console.warn
  warning  : console.warn
  error    : console.error
  critical : console.error