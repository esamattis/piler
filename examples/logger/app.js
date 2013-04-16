var express = require('express');
var app = express();
var http = require('http');
var socketio = require('socket.io');
var pile = require("../../index");
var logger = {};
var share = require("./share");

console.log(share.test());

function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var loggerConf = {
    levels: {
      debug: 0,
      info: 1,
      notice: 2,
      warn: 3,
      warning: 3,
      error: 4,
      critical: 5,
      crit: 5,
      alert: 6,
      emerg: 7
    },
    colors: {
      debug: 'grey',
      info: 'blue',
      notice: 'green',
      warn: 'yellow',
      warning: 'yellow',
      error: 'red',
      critical: 'red',
      crit: 'red',
      alert: 'red',
      emerg: 'red'
    },
    transports: [
        new (require('winston').transports.Console)({
            colorize: true,
            timestampe: true,
            "level": 'debug',
            "silent": false
        })
    ]
};

var logger = new (require('winston').Logger)(loggerConf);

var srv = http.createServer(app);

// Socket.IO
var io = socketio.listen(srv,{"logger":logger});

io.configure(function(){
    io.enable('browser client gzip');
    io.enable('browser client minification');
    io.disable('flash policy server');
});

// Piler config
var js = pile.createJSManager({ outputDirectory: __dirname + "/out", "logger":logger });
var css = pile.createCSSManager({ outputDirectory: __dirname + "/out", "logger":logger });

js.bind(app,srv);
css.bind(app,srv);

app.configure(function() {
    app.set('views', __dirname + "/views");
});

app.configure("development", function() {
   js.liveUpdate(css,io);
});

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


app.get("/", function(req, res){

  res.exec(function() {
     console.log("Run client code from the response", FOO);
     console.log(share.test());
  });

  res.render("index.jade", {
    layout: false,
    js: js.renderTags("foo"),
    css: css.renderTags()
  });
});

srv.listen(8001, function(){
 logger.notice("listening on 8001");
});
