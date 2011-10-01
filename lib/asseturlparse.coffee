_  = require 'underscore'
_.mixin require 'underscore.string'

module.exports = (url) ->
  ob = {}

  # remove qs
  url = _.first url.split "?"
  filename = _.last url.split "/"

  [__..., name, mode, ext] = filename.split "."

  if _.startsWith mode, "dev-"
    [__, type, uid] = mode.split "-"
    ob.dev =
       uid: uid
       type: type
  else
    ob.min = true

  ob.name = name
  ob.ext = ext

  return ob


