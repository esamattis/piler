express = require "express"
pile = require("../../index")

js = pile.createJSManager()
css = pile.createCSSManager()


app = express.createServer()
app.configure ->
   app.use express.static __dirname + '/clientscripts'

js.bind app
css.bind app


css.addFile __dirname + "/stylesheets/style.css"
css.addFile __dirname + "/stylesheets/style.styl"
css.addFile __dirname + "/stylesheets/style.less"
css.addRaw "#raw { display: none }"


js.addOb "addOb global": true

js.addUrl "/remote.js"

js.addFile __dirname + "/clientscripts/jquery.js"
js.addFile __dirname + "/clientscripts/global.js"
js.addFile __dirname + "/clientscripts/global.coffee"

js.addRaw "window['raw js'] = true;"
js.addRaw "mynamespace", "window['raw namespace js'] = true;"

js.addFile "mynamespace", __dirname + "/clientscripts/namespace.js"


js.addExec ->
  window["js exec"] = true

js.addExec "mynamespace", ->
  window["namespace js exec"] = true


js.addOb "namespaceob.first": true
js.addOb "namespaceob.second": true

app.get "/namespace", (req, res) ->
  res.render "namespace.jade",
   layout: false



app.get "/", (req, res) ->
  res.addExec ->
   window["response exec"] = true

  res.addOb
    "response ob": true

  res.addOb
    "res.namespace.works.too": true

  res.render "index.jade"

port = if process.env.NODE_ENV is "production" then 7001 else 7000

app.listen port
console.log "server running on port #{ port }"

