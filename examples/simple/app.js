
var createServer = require("express").createServer;

var pile = require("../../index");
var js = pile.createJSManager({ outputDirectory: __dirname + "/out" });
var css = pile.createCSSManager({ outputDirectory: __dirname + "/out" });


var share = require("./share");
console.log(share.test());

function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var app = createServer();

js.bind(app);
css.bind(app);


css.addFile(__dirname + "/style.css");
css.addFile(__dirname + "/style.styl");
css.addFile(__dirname + "/style.less");

js.addOb({MY: {
   isEmail: isEmail
   }
});

js.addOb({FOO: "bar"});
js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js");

js.addFile(__dirname + "/client/underscore.js");
js.addFile(__dirname + "/client/backbone.js");
js.addFile(__dirname + "/client/hello.js");
js.addFile(__dirname + "/client/hello.coffee");
js.addFile("foo", __dirname + "/client/foo.coffee");
js.addFile("bar", __dirname + "/client/bar.coffee");
js.addFile(__dirname + "/share.js");


app.configure("development", function() {
   js.liveUpdate(css);
});

app.get("/", function(req, res){

  res.exec(function() {
     console.log("Run client code from the response", FOO);
     console.log(share.test());
  });

  res.render("index.jade");
});

app.listen(8001);
