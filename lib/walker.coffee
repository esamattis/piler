fs = require "fs"
minimatch = require "minimatch"
_ = require "underscore"

readByKind = (dir) ->
  files = fs.readdirSync dir
  _(files).groupBy (file) ->
    stat = fs.statSync "#{dir}/#{file}"
    if stat.isDirectory() then "directories" else if stat.isFile() then "files" else "other"

walk = (dir, prefix) ->
  prefix = if prefix then "#{prefix}/" else ""
  descriptors = readByKind dir
  _(descriptors.directories).reduce (memo, directory) ->
    memo.concat(walk "#{dir}/#{directory}", "#{prefix}#{directory}")
  , _(descriptors.files).map (file) ->
    "#{prefix}#{file}"

module.exports =
  walk: (dir, patterns) ->
    files = walk dir
    return if not patterns then files else _.chain(patterns).reduce((memo, pattern) ->
      memo.concat files.filter minimatch.filter pattern
    , []).uniq().value()
