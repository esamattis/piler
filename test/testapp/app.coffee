http = require('http')
serveStatic = require "serve-static"
app = require("express")()
pile = require("../../lib")

js = pile.createJSManager()
css = pile.createCSSManager()

app.use serveStatic __dirname + '/clientscripts'

app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'
app.set 'view options', {layout: 'layout'}

server = http.createServer(app)

js.bind app, server
css.bind app, server

css.addFile __dirname + "/stylesheets/style.css"
css.addFile "namespaced", __dirname + "/stylesheets/namespaced.css"
css.addFile __dirname + "/stylesheets/style.styl"
css.addFile __dirname + "/stylesheets/import.styl"
css.addFile __dirname + "/stylesheets/style.less"
css.addRaw "#raw { display: none }"


js.addOb "addOb global": true

js.addUrl "/remote.js"

js.addFile __dirname + "/clientscripts/jquery.js"
js.addFile __dirname + "/clientscripts/global.js"
js.addFile __dirname + "/clientscripts/global.coffee"

js.addRaw "window['raw js'] = true;"
js.addRaw "mynamespace", "window['raw namespace js'] = true;"
# js.addModule __dirname + "/sharedmodule.coffee"

js.addFile "mynamespace", __dirname + "/clientscripts/namespace.js"

js.addExec ->
  window["js exec"] = true

js.addExec "mynamespace", ->
  window["namespace js exec"] = true


js.addOb "namespaceob.first": true
js.addOb "namespaceob.second": true

app.get "/namespace", (req, res) ->
  res.render "namespace",
   layout: false
   js: js.renderTags "mynamespace"
   css: css.renderTags "mynamespace"

app.get "/", (req, res) ->

  res.render "index",
    js: js.renderTags()
    css: css.renderTags("namespaced")

port = if process.env.NODE_ENV is "development"
    type = 'developement'
    7000
  else
    type = 'production'
    7001

server.listen port

console.log "#{type} server running on port #{ port }"

