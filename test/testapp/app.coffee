http = require('http')
serveStatic = require('serve-static')
app = require('express')()
Piler = require('../../lib')

js = Piler.createManager('js')
css = Piler.createManager('css')
html = Piler.createManager('html')

app.use(serveStatic(__dirname + '/clientscripts'))

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.set('view options', {layout: 'layout'})

server = http.createServer(app)

app
  .use(js.middleware())
  .use(css.middleware())
  .use(html.middleware())

#css.addFile(__dirname + '/stylesheets/style.css')
css.addFile(__dirname + '/stylesheets/namespaced.css', {namespace: 'namespaced'})
#css.addFile(__dirname + '/stylesheets/style.styl')
#css.addFile(__dirname + '/stylesheets/import.styl')
#css.addFile(__dirname + '/stylesheets/style.less')
css.addRaw('#raw { display: none }', {extra:{media: 'screen and (min-width: 701px) and (max-width: 900px)'}})

html.addMultiline(->###
  <h1 class="really">Testing</h1>
###
{namespace:'mynamespace'}
)

js.addOb({'addOb global': true})

js.addUrl('/remote.js')

js.addFile(__dirname + '/clientscripts/jquery.js')
js.addFile(__dirname + '/clientscripts/global.js')
js.addFile(__dirname + '/clientscripts/global.coffee')

js.addRaw('window["raw js"] = true;')
js.addRaw('window["raw namespace js"] = true;', {namespace: 'mynamespace'})
# js.addModule(__dirname + '/sharedmodule.coffee')

js.addFile(__dirname + '/clientscripts/namespace.js', {namespace: 'mynamespace'})

js.addExec( ->
  window['js exec'] = true
)

js.addMultiline(->###
  window['coffee multiline'] = -> @
###
{processors:{'coffeescript':{}}})

js.addExec(->
  window['namespace js exec'] = true
, {namespace:'mynamespace'})

js.addOb({'namespaceob.first': true})
js.addOb({'namespaceob.second': true})

app.get('/namespace', (req, res) ->

  res.piler.render('namespace', {
    layout: false
    js: js.render(['mynamespace'])
    css: css.render(['mynamespace'])
    html: html.render(['mynamespace'])
  })
)

app.get('/', (req, res) ->

  res.piler.render('index', {
    js: js.render()
    css: css.render(['namespaced'])
    html: html.render(['namespaced'])
  })
)

port = if process.env.NODE_ENV is 'development'
  type = 'developement'
  7000
else
  type = 'production'
  7001

server.listen(port, ->
  console.log("#{type} server running on port #{ port }")
)


