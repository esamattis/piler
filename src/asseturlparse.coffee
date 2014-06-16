'use strict'

_  = require 'underscore'
_.mixin require 'underscore.string'
module.exports.debug = debug = require("debug")("piler:asseturlparse")

module.exports = p = (url) ->
  ob = {}

  # remove qs
  url = _.first url.split "?"
  [__..., mode, filename] = url.split "/"


  debug('asset', url, mode, filename)

  if mode is "dev"
    [__..., name, devopt, ext] = filename.split "."
    [type, uid] = devopt.split "-"
    debug('parsing in dev mode', url, type, uid)
    ob.dev =
       uid: uid
       type: type
  else
    [__..., name, ext] = filename.split "."
    debug('parsing in prod mode', url, name, ext)
    ob.min = true

  ob.name = name
  ob.ext = ext

  ob
