
coffeescript = require "coffee-script"
fs = require "fs"

{minify, beautify} = require "./minify"



# Remove last comma from string
removeTrailingComma = (s) ->
  s.trim().replace(/,$/, "")

# Return current unix time
getCurrentTimestamp = -> (new Date()).getTime()

# Timestamp of the time when this server was started. Used for killing browser
# caches.
startTime = getCurrentTimestamp()


# Map of functions that can convert various Javascript objects to strings.
types =

  function: (fn) -> "#{ fn }"
  string: (s) -> "\"#{ s }\""
  number: (n) -> n.toString()
  boolean: (n) -> n.toString()

  object: (obj) ->

    # typeof reports array as object
    return this._array obj if Array.isArray obj

    code = "{"
    code +=  "\"#{ k }\": #{ codeFrom v }," for k, v of obj
    removeTrailingComma(code) + "}"

  _array: (array) ->
    code = "["
    code += " #{ codeFrom v },"  for v in array
    removeTrailingComma(code) + "]"


# Generates code string from given object. Works for numbers, strings, regexes
# and even functions. Does not handle circular references.
codeFrom = (obj) ->
  types[typeof obj]?(obj)


# Creates immediately executable string presentation of given function.
# context will be function's "this" if given.
executableFrom = (fn, context) ->
  return "(#{ fn })();\n" unless context
  return "(#{ fn }).call(#{ context });\n"


wrapInScriptTagInline = (code) ->
  "<script>\n#{ code }\n</script>\n"


# Wraps given URI to a script tag. Will kill browser cache using timestamp
# query string if killcache is true.
wrapInScriptTag = (uri, killcache) ->
  timestamp = if killcache then getCurrentTimestamp() else startTime
  "<script src=\"#{ uri }?v=#{ timestamp }\"></script>"







exports.addCodeSharingTo = (app) ->

  # Set default scripts-directory
  if not app.set "clientscripts"
    app.set "clientscripts", "#{ process.cwd() }/clientscripts"




  # Path to a directory of client-side only scripts.
  scriptDir = app.set "clientscripts"

  # All code that is embedded in Node.js code that will be sent to browser.
  compiledEmbeddedCode = null

  # All client-side code in production (except externals).
  productionClientCode = ""

  # Cache for compiled script-tags
  compiledTags = null

  # List of functions that are ran when the app starts listening a port.
  runOnListen = []

  # Array of client-side script names
  try
    clientScriptsFs = fs.readdirSync(scriptDir).sort() # TODO: recursive.
  catch err
    # Directory is just missing
    clientScriptsFs = []

  # Array of external client-side script urls.
  scriptURLs = []

  # Variables that are shared with Node.js and browser.
  clientVars = {}

  # Functions that will executed immediately in browser when loaded.
  clientExecs = []

  # Function for getting all script tags.
  # Configure will create this.
  getScriptTags = null


  # Collect shared variables and code and wrap them in a closure for browser
  # execution.
  runOnListen.push ->

    # Create common namespace for shared code
    compiledEmbeddedCode = "window.REALLYEXPRESS = {};\n"

    # Start closure.
    compiledEmbeddedCode += "(function(){\n"

    variableNames = (name for name, _ of clientVars).join(", ")

    ## Collect shared variables and functions.

    # Shared variables can be found from "this" or as variables in this scope
    compiledEmbeddedCode += "var #{ removeTrailingComma variableNames };\n"
    for name, variable of clientVars
      compiledEmbeddedCode += "#{ name } = this.#{ name } = #{ codeFrom variable };\n"

    # Collect immediately executable code
    for fn in clientExecs
      compiledEmbeddedCode += executableFrom fn

    # "this" will be REALLYEXPRESS instead of global window.
    compiledEmbeddedCode += "}).call(REALLYEXPRESS);\n"
    compiledEmbeddedCode = beautify compiledEmbeddedCode



  app.configure "development", ->

    # Development version getScriptTags
    getScriptTags = ->

      # External client scripts. CDNs etc.
      tags = (wrapInScriptTag url, true for url  in scriptURLs)

      # Client scripts on filesystem
      for  script in clientScriptsFs
        script = script.trim().replace(/\.coffee$/, ".js")
        tags.push wrapInScriptTag "/managedjs/dev/#{ script }", true

      # Embedded scripts
      tags.push wrapInScriptTag "/managedjs/embedded.js", true
      return tags.join "\n"


  app.configure "production", ->

    # Production version of getScriptTags
    getScriptTags = ->
      return compiledTags if compiledTags

      # External client scripts
      tags = (wrapInScriptTag url for url  in scriptURLs)
      # Everything else is bundled in production.js
      tags.push wrapInScriptTag "/managedjs/production.js"

      return compiledTags = tags.join "\n"

    for script in clientScriptsFs
      script = "#{ scriptDir }/#{ script }"
      console.log "compile #{ script }"
      if script.match /\.js$/
        productionClientCode +=  fs.readFileSync(script).toString()
      else if script.match /\.coffee$/
        productionClientCode += coffeescript.compile fs.readFileSync(script).toString()


    # We will allow usage of production.js only in production mode
    runOnListen.push ->
      productionClientCode += compiledEmbeddedCode
      productionClientCode = minify productionClientCode

      # All js code will be shared from here in production
      app.get "/managedjs/production.js", (req, res) ->
        # TODO: Set cache time to forever. Timestamps will kill the cache when
        # required.
        res.send productionClientCode, 'Content-Type': 'application/javascript'







  app.use (req, res, next) ->
    console.log "testing"
    console.log this
    console.log this == app
    res.share = () ->
      console.log "SHARER!!!"
    res.codeee = "CODE"
    next()


  # Dynamic helper for templates. bundleJavascript will return all required
  # script-tags.
  app.dynamicHelpers bundleJavascript: (req, res) ->

    bundle = getScriptTags()

    # Add code that should be executed only on this request
    if typeof res.exec == "function"
      bundle += wrapInScriptTagInline executableFrom res.exec, "REALLYEXPRESS"
    else if  Array.isArray res.exec
      for fn in res.exec
        bundle += wrapInScriptTagInline executableFrom fn, "REALLYEXPRESS"

    return  bundle



  # All client-side code embedded in node.js code will shared from here.
  app.get "/managedjs/embedded.js", (req, res) ->
    res.send compiledEmbeddedCode, 'Content-Type': 'application/javascript'


  # Client-side only script are shared from here.
  app.get "/managedjs/dev/:script.js", (req, res) ->

    # TODO: we should only compile when file really changed by checking
    # modified timestamp. Does this really matter in development-mode?

    fs.readFile "#{ scriptDir }/#{ req.params.script }.js", (err, data) ->
      if not err
        res.send data, 'Content-Type': 'application/javascript'
      else
        fs.readFile "#{ scriptDir }/#{ req.params.script }.coffee", (err, data) ->
          if not err
            res.send coffeescript.compile(data.toString())
              , 'Content-Type': 'application/javascript'
          else
            res.send "Could not find script #{ req.params.script }.js"
             , ('Content-Type': 'text/plain'), 404



  # Extends Express server object with function that will share given Javascript
  # object with browser. Will work for functions too, but be sure that you will
  # use only pure functions. Scope or context will not be same in the browser.
  #
  # Variables will added as local variables in browser and also in to
  # REALLYEXPRESS object.
  app.share = (name, value) ->
    if typeof name is "object"
      for k, v of name
        clientVars[k] = v
      return name

    clientVars[name] = value

  # Extends Express server object with function that will executed given function in
  # the browser as soon as it is loaded.
  app.exec = (fn) ->
    clientExecs.push(fn)
    return fn


  # Extends Express server object with function that will execute given
  # Javascript URL  in the browser as soon as it is loaded.
  app.scriptURL = (obj) ->
    if Array.isArray obj
      scriptURLs.unshift url for url in obj.reverse()
    else
      scriptURLs.unshift obj



  # Run when app starts listening a port
  app.on 'listening', ->
    fn() for fn in runOnListen


  return app


