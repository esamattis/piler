'use strict'

_  = require 'underscore'
_.mixin require 'underscore.string'
debug = require("debug")("piler:asserurlparse")

module.exports = p = (url) ->
  ob = {}

  # remove qs
  url = _.first url.split "?"
  [__..., mode, cachekey, filename] = url.split "/"


  if mode is "dev"
    [__..., name, devopt, ext] = filename.split "."
    [type, uid] = devopt.split "-"
    ob.dev =
       uid: uid
       type: type
  else
    [__..., name, ext] = filename.split "."
    ob.min = true

  ob.name = name
  ob.ext = ext

  return ob
