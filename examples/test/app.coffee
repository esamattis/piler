
fs = require "fs"

express = require 'express'
{addCodeSharingTo} = require "express-share"

# Read to fake db
db = JSON.parse fs.readFileSync "candidates.json"

app = express.createServer()
addCodeSharingTo app


app.scriptURL "https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.js"

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set "home", "/Foo"
  app.use express.bodyParser()
  app.use express.compiler enable:  ["coffeescript", "less"], src: __dirname + '/public'
  app.use express.static __dirname + '/public'


app.share "test_basic_share", true
app.share test_object_share: true

app.exec ->
  window.test_exec = true



app.get "/", (req, res) ->
  res.share "test_res_basic_share", true
  res.share test_res_object_share: true
  res.exec ->
    window.test_res_exec = true

  res.render 'index.jade',
    title: "Testing"
    contentText: "content tekit"


app.listen 1234


