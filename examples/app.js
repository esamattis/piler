//process.env.NODE_ENV = 'development';
process.env.NODE_ENV = 'production';

var app = require('express')();
var server = require('http').createServer(app);

var Piler = require('../lib');
var LiveCSS = Piler.require('../lib/modules/livecss');

var js = Piler.createManager('js', {outputDirectory: __dirname + "/out"});
var css = Piler.createManager('css', {outputDirectory: __dirname + "/out"});

/* adds the livescript preprocessor to it */
Piler.addCompiler('livescript', function(){
  var ls = require('LiveScript');

  return {
    render: function(filename, code) {
      return ls.compile(code);
    },
    outputExt: 'js',
    targetExt: ['ls']
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
  .use(css.middleware());

app.set('views', __dirname + "/views");

// will initialize live css editing when in development mode
LiveCSS.init(js, css, server/*, require('socket.io')(server)*/);

// add some stylesheet files
css.addFile(__dirname + "/style.css");
css.addFile(__dirname + "/style.styl");
css.addFile(__dirname + "/style.less");

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
*/}, {options: {compilers: ['livescript']}});

// Same as above, ask Piler to treat it as coffeescript
js.addMultiline(function(){/*
  console.log """
    Awesomesauce, template string coffescript
  """
*/}, {options: {compilers: ['coffeescript']}});

// Urls are passed to the browser as-is, wrapped in their respective tags
// in this case,
// <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js" type="text/javascript" defer="defer"></script>
js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js", {tag: {'defer':'defer'}});

// Add some files
js.addFile(__dirname + "/client/underscore.js");
js.addFile(__dirname + "/client/backbone.js", {before: true});
js.addFile(__dirname + "/client/hello.js");
js.addFile(__dirname + "/client/hello.coffee");
js.addFile(__dirname + "/client/hello.ls");
js.addFile(__dirname + "/client/foo.coffee", {namespace: 'foo'});
js.addFile(__dirname + "/client/bar.coffee", {namespace: 'bar'});
js.addFile(__dirname + "/share.js");

// You can optionally add a directory, the only drawback
// is that you can't set per file options
js.addDir(__dirname + "/client/*.js");

app.get('/', function (req, res){

  res.piler.js.addExec(function (){
    console.log('Run client code from the response', FOO);
    console.log(share.test());
  });

  res.piler.css.addRaw('h2{' +
    'text-decoration: underline;' +
  '}');

  res.piler.css.addUrl('//cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css', {before: true});

  res.render('index.jade', {
    layout: false,
    js    : js.renderTags('foo','bar'),
    css   : css.renderTags()
  });
});

server.listen(8001, function (){
  console.log('listening on 8001');
});
