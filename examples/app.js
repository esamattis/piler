process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';

var app = require('express')();
var server = require('http').createServer(app);

var Piler = require('../lib');
var LiveCSS = Piler.require('../lib/modules/livecss');

var js = Piler.createManager('js', {outputDirectory: __dirname + "/out"});
var css = Piler.createManager('css', {outputDirectory: __dirname + "/out"});
var html = Piler.createManager('html', {outputDirectory: __dirname + "/out"});

/* adds the livescript preprocessor to it */
Piler.addCompiler('livescript', function(){
  var ls = require('LiveScript');

  return {
    execute: function(filename, code) {
      return ls.compile(code);
    },
    targetExt: 'js',
    on: {
      file: '.ls' // matches only file types that end with .ls
    }
  };
});

/*
   Cache is only used during production, you can distribute this to a CDN.
   It's used by compilers and minifiers
*/
var memoryCache = {};

Piler.useCache(function(code, hash, fnCompress){
  if (typeof memoryCache[hash] === 'undefined') {
    console.log('not cached, caching hash', hash);
    memoryCache[hash] = fnCompress(); //execute the function
  }
  return memoryCache[hash];
});

var share = require("./share");
console.log(share.test());

function isEmail(s){
  return !!s.match(/.\w+@\w+\.\w/);
}

app
  .use(js.middleware())
  .use(css.middleware())
  .use(html.middleware())
;

app.set('views', __dirname + "/views");

// add some stylesheet files
css.batch([
  ['addFile', __dirname + "/style.css"],
  ['addFile', __dirname + "/style.styl"],
  ['addFile', __dirname + "/style.less"]
]).done(function(){
  // will initialize live css editing when in development mode
  LiveCSS.init(js, css, server/*, require('socket.io')(server)*/);
});

// add a real object to the browser, reuse the same isEmail
// function in both Node.js and the browser, will be available in
// window.MY.isEmail
js.addOb({
  MY: {
    isEmail: isEmail
  }
});

// Will be available in window.FOO
js.addOb({FOO: "bar"});

// Add any kind of stuff using comments, it keeps every white space
// In this example, we are adding inline livescript, and asking Piler
// to treat is as livescript
js.addMultiline(function(){/*
  console.log 'Awesomesauce,
      multiline string in
    livescript'
*/}, {compilers: ['livescript']});

// Same as above, ask Piler to treat it as coffeescript
js.addMultiline(function(){/*
  console.log """
    Awesomesauce, template string coffescript
  """
*/}, {compilers: ['coffeescript']});

// Urls are passed to the browser as-is, wrapped in their respective tags
// in this case,
// <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js" type="text/javascript" defer="defer"></script>
js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js", {extra: {'defer':'defer'}});

// Add some files
js.addFile(__dirname + "/client/backbone.js");
js.addFile(__dirname + "/client/hello.js");
js.addFile(__dirname + "/client/hello.coffee");
js.addFile(__dirname + "/client/hello.ls");
js.addFile(__dirname + "/client/foo.coffee", {namespace: 'foo'});
js.addFile(__dirname + "/client/bar.coffee", {namespace: 'bar'});
js.addFile(__dirname + "/share.js");
js.addFile(__dirname + "/client/underscore.js",{before: true}); // goes before all of those

// You can optionally add a directory, the only drawback
// is that you can't set per file options
// js.addDir(__dirname + "/client/*.js");

html.addMultiline(function(){/*
<div>
  <h3>Inline HTML ftw</h3>
</div>
<!-- Im hidden -->
*/}).then(function(){
  html.contents();
});

app.get('/', function (req, res){

  // add all resources in order, then serve

  Piler.utils.Q.all([
    res.piler.js.addExec(function (){
      console.log('Run client code from the response', FOO);
      console.log(share.test());
    }),
    res.piler.css.addRaw('h2{' +
      'text-decoration: underline;' +
    '}'),
    res.piler.html.addMultiline(function(){/*
      <div>great minds think alike multiline</div>
    */}),
    res.piler.html.addRaw('<span></span>'),
    res.piler.css.addUrl('//cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css', {before: true})
  ]).done(function(){
    res.piler.render('index.jade', {
      layout: false,
      js    : js.render('foo','bar'),
      css   : css.render(),
      html  : html.render()
    });
  });
});

server.listen(8001, function (){
  console.log('listening on 8001');
});
