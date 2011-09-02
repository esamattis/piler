
var createServer = require("express").createServer;

var piles = require("../../index");
var js = piles.createJSManager();
var css = piles.createCSSManager();


function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var app = createServer();

js.bind(app);
css.bind(app);


css.shareFile(__dirname + "/style.css");
css.shareFile(__dirname + "/style.styl");


js.shareOb({FOO: "bar"});
js.shareUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js");

js.shareFile(__dirname + "/client/hello.js");
js.shareFile(__dirname + "/client/hello.coffee");
js.shareFile("foo", __dirname + "/client/foo.coffee");
js.shareFile("bar", __dirname + "/client/bar.coffee");

app.get("/", function(req, res){

  res.exec(function() {
     console.log("res exec hello", FOO);
  });

  res.render("index.jade");
});

app.listen(8001);
