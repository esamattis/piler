_  = require 'underscore'
_.mixin require 'underscore.string'

module.exports = (url) ->
  ob = {}

  # remove qs
  url = _.first url.split "?"
  [__..., mode, filename] = url.split "/"


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


