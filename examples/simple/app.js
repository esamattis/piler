//process.env.NODE_ENV = 'development';
process.env.NODE_ENV = 'production';

var app = require("express")();
var server = require('http').createServer(app);

var piler = require("../../index");
var js = piler.createJSManager({outputDirectory: __dirname + "/out"});
var css = piler.createCSSManager({outputDirectory: __dirname + "/out"});

/* adds the livescript preprocessor to it */
piler.addCompiler('ls', function(){
  var ls = require('LiveScript');

  return {
    render: function(filename, code, cb) {
        try {
            code = ls.compile(code);
            cb(null, code);
        } catch (e) {
            cb(e);
        }
    },
    targetExt: 'js'
  };
});

/* Cache is only used during production */
var memoryCache = {};

piler.useCache(function(code, hash, fnCompress){
  if (typeof memoryCache[hash] === 'undefined') {
    console.log('not cached, caching hash', hash);
    memoryCache[hash] = fnCompress(); //retrieve the minified code
  }
  return memoryCache[hash];
});

var share = require("./share");
console.log(share.test());

function isEmail(s){
  return !!s.match(/.\w+@\w+\.\w/);
}

js.bind(app, server);
css.bind(app, server);

app.set('views', __dirname + "/views");

if (process.env.NODE_ENV === 'development') {
  js.liveUpdate(css, require('socket.io').listen(server));
}

css.addFile(__dirname + "/style.css");
css.addFile(__dirname + "/style.styl");
css.addFile(__dirname + "/style.less");

js.addOb({
  MY: {
    isEmail: isEmail
  }
});

js.addOb({FOO: "bar"});
js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js");

js.addFile(__dirname + "/client/underscore.js");
js.addFile(__dirname + "/client/backbone.js");
js.addFile(__dirname + "/client/hello.js");
js.addFile(__dirname + "/client/hello.coffee");
js.addFile(__dirname + "/client/hello.ls");
js.addFile("foo", __dirname + "/client/foo.coffee");
js.addFile("bar", __dirname + "/client/bar.coffee");
js.addFile(__dirname + "/share.js");

app.get("/", function (req, res){

  res.piler.js.addExec(function (){
    console.log("Run client code from the response", FOO);
    console.log(share.test());
  });

  res.piler.css.addRaw("h2{" +
    "text-decoration: underline;" +
  "}");

  res.render("index.jade", {
    layout: false,
    js    : js.renderTags("foo"),
    css   : css.renderTags()
  });
});

server.listen(8001, function (){
  console.log("listening on 8001");
});
