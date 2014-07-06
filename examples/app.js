process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';

var app = require('express')();
var http = require('http');
var server = http.createServer(app);

var Piler = require('../lib');
var LiveCSS = Piler.LiveCSS;

var js = Piler.createManager('js', {outputDirectory: __dirname + '/out', cacheKeys: false});
var css = Piler.createManager('css', {outputDirectory: __dirname + '/out'});
var html = Piler.createManager('html', {outputDirectory: __dirname + '/out'});

/* adds the livescript preprocessor to it */
Piler.addProcessor('livescript', function(){
  var ls = require('LiveScript');

  return {
    pre: {
      render: function(code, asset, options) {
        return ls.compile(code);
      },
      defaults: {},
      condition: function(asset, options){
        return asset.filePath && (asset.filePath.indexOf('.ls') > -1);
      }
    }
  };
});

/*
   Cache is only used during production, you can distribute this to a CDN.
   It's used by processors and calls to CodeObject.contents()
*/
var memoryCache = {};

Piler.useCache(function(hash, fnCompress){
  // this will overwrite the existing file cache to a memory cache
  // (that doesn't live between restarts) for file contents, pre and post render of
  // processors
  //
  if (typeof memoryCache[hash] === 'undefined') {
    console.log('not cached, caching hash', hash);
    //execute the function
    return fnCompress().then(function(code){
      return (memoryCache[hash] = code);
    });
  }
  return memoryCache[hash];
});

var share = require('./share');
console.log(share.test());

function isEmail(s){
  return !!s.match(/.\w+@\w+\.\w/);
}

app
  .use(js.middleware())
  .use(css.middleware())
  .use(html.middleware())
;

app.set('views', __dirname + '/views');

// add some stylesheet files
css.batch([
  ['addFile', __dirname + '/style.css'],
  ['addFile', __dirname + '/style.styl'],
  ['addFile', __dirname + '/style.less']
]);

// will initialize live css editing when in development mode
LiveCSS.init(js, css, server, require('socket.io')(server));

// add a real object to the browser, reuse the same isEmail
// function in both Node.js and the browser, will be available in
// window.MY.isEmail
js.addOb({
  MY: {
    isEmail: isEmail
  }
});

// Will be available in window.FOO
//spaces and non letters / numbers are converted to _
js.addOb({FOO: 'bar'}, {name: 'named asset is static! breakpoint at will'});


// Add any kind of stuff using comments, it keeps every white space intact
// In this example, we are adding inline livescript, and asking Piler
// to treat is as livescript
js.addMultiline(function(){/*
  console.log 'Awesomesauce,
      multiline string in
    livescript'
*/}, {processors: {'livescript':{}}});

// Same as above, ask Piler to treat it as coffeescript
js.addMultiline(function(){/*
  console.log """
    Awesomesauce, template string coffescript
  """
*/}, {processors: {'coffeescript':{}}});

// Urls are passed to the browser as-is, wrapped in their respective tags
// in this case,
// <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js" type="text/javascript" defer="defer"></script>
js.addUrl('http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js', {extra: {'defer':'defer'}});

// Add some files
js.addFile(__dirname + '/client/backbone.js')
  .addFile(__dirname + '/client/hello.js')
  .addFile(__dirname + '/client/hello.coffee')
  .addFile(__dirname + '/client/hello.ls')
  .addFile(__dirname + '/client/foo.coffee', {namespace: 'foo'})
  .addFile(__dirname + '/client/bar.coffee', {namespace: 'bar'})
  .addFile(__dirname + '/share.js')
  .addFile(__dirname + '/client/underscore.js', {before: true}); // goes before all of those

// You can optionally add all files in a directory, the only drawback
// is that you can't set per file options
js.addWildcard(__dirname + '/client/*.js');

html.addMultiline(function(){/*
<div>
  <h3>
    Inline white space preserved HTML ftw
      </h3>
</div>
<!-- Im hidden -->
*/});

// Can concatenate an existing view, and give it a GET parameter, like /piler/dev/global.file-inline.html
html.addFile(__dirname + '/views/inline.html', {name: 'inline'});

// contents() saves the pile to a file, if outputDirectory is set
// the context here is the HTMLManager
html.contents();

app.get('/', function (req, res){

  // add all resources, then serve
  res.piler.js.addExec(function (){
    console.log('Run client code from the response', FOO);
    console.log(share.test());
  });

  res.piler.css.addRaw('h2{' +
    'text-decoration: underline;' +
  '}');

  res.piler.html.addMultiline(function(){/*
    <div>great minds think alike multiline</div>
  */});

  res.piler.html.addRaw('<span>...</span>');
  res.piler.css.addUrl('//cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css', {before: true});

  res.piler.render('index.jade', {
    layout: false,
    js    : js.render(['foo','bar']),
    css   : css.render(),
    html  : html.render()
  });
});

server.listen(8001, function(){
  console.log('Open browser on http://127.0.0.1:8001');
});