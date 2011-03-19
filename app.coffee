

createServer = require("./expresscoffee.coffee").createServer

app = createServer()
app.configure ->
  app.set 'views', __dirname + '/views'


app.clientVar "my", 1
app.clientVar "myregexp", /foo/
app.clientVar "mys", "foo"
app.clientVar "myOb", 
  paska: NaN
  taulukko: [1, 2, 3, {foo: 3}]
  fun: -> 5
  loo: "foo"
  sub:
    foo: 4
    regexp: /Dfasd/
    fn: (v) ->
      "LOL" + v


app.clientVar "myfjll", ->
  alert "hello"


app.clientExec ->
  alert myOb.sub.fn(3)


app.get "/", (req, res) ->
  res.render 'hello.jade', title: "from code", contentText: "content tekit"




app.listen 2222
