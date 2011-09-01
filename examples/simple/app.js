
var createServer = require("express").createServer;

var piles = require("../../index");


function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var app = createServer();

piles.script.bind(app);
piles.style.bind(app);

piles.style.shareFs(__dirname + "/style.css");
piles.style.shareFs(__dirname + "/style.styl");

piles.script.shareFs(__dirname + "/client/hello.js");
piles.script.shareFs(__dirname + "/client/hello.coffee");
piles.script.shareFs("foo", __dirname + "/client/foo.coffee");
piles.script.shareFs("bar", __dirname + "/client/bar.coffee");

app.get("/", function(req, res){

  res.exec(function() {
     console.log("res exec hello");
  });

  res.render("index.jade");
});

app.listen(8001);
