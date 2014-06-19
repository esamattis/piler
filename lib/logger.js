module.exports = function(classes, mainExports) {
  'use strict';
  return {
    debug: console.debug,
    notice: console.log,
    info: console.info,
    warn: console.warn,
    warning: console.warn,
    error: console.error,
    critical: console.error
  };
};
