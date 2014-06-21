module.exports = (Piler) ->
  'use strict'

  ###*
   * @namespace Piler.AssetUrlParse
  ###

  ###*
   * @typedef {Object} Piler.AssetUrlParse.ParseObject
   * @property {String} name Filename
   * @property {String} ext Extension
   * @property {Boolean} [min] Set to true if the parsed url is a production url
   * @property {Object} [dev] This object is set if the detected url is a development object
   * @property {String} dev.uid The hash of the asset
   * @property {String} dev.type The type of the asset
  ###

  ###*
   * Output debug messages as if it was from {@link Piler.AssetUrlParse}
   * @function Piler.AssetUrlParse.debug
  ###
  debug: debug = Piler.utils.debug("piler:asseturlparse")
  ###*
   * Parse an URL for assets information
   *
   * @function Piler.AssetUrlParse.parse
   * @param {String} url Any valid URL or URI
   * @returns {Piler.AssetUrlParse.ParseObject}
  ###
  parse: (url) ->
    return if not url

    ob = {}

    # remove qs
    url = Piler.utils._.first url.split "?"
    [__..., mode, filename] = url.split "/"

    return if not mode or not filename

    debug('asset', url, mode, filename)

    if mode is "dev"
      [__..., name, devopt, ext] = filename.split "."
      return if not name or not devopt or not ext
      [type, uid] = devopt.split "-"
      debug('parsing in dev mode', url, type, uid)
      ob.dev =
         uid: uid
         type: type
    else
      [__..., name, ext] = filename.split "."
      return if not name or not ext
      debug('parsing in prod mode', url, name, ext)
      ob.min = true

    ob.name = name
    ob.ext = ext

    ob
