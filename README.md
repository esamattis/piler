# Piler

[![Build Status](https://secure.travis-ci.org/epeli/piler.svg)](http://travis-ci.org/epeli/piler)
[![Coverage Status](https://coveralls.io/repos/epeli/piler/badge.png)](https://coveralls.io/r/epeli/piler)
[![Dependency Status](https://david-dm.org/epeli/piler.svg)](https://david-dm.org/epeli/piler)
[![Module Version](http://img.shields.io/npm/v/piler.svg)](https://npmjs.org/package/piler)

[![NPM](https://nodei.co/npm/piler.svg?downloads=true&stars=true)](https://nodei.co/npm/piler/)

## Feature highlights

* Dual API Callback/Promise based interface, since dealing with assets and file contents are asynchronous
by nature (serving, compiling, reading, writing, caching). A lot of preprocessors and template engines are
asynchronous, and Piler need to comply with that. Plus it enables a flow interface that can join in multiple
3rd party modules alongside with Piler, like it happens with streams interface.

* Minify and concatenate JS and CSS for fast page loads

* Tag rendering, for example, `<script type="text/javascript" src="..."></script>`,
`<link href="...">`, `<script type="text/ng-template">...</script>`, etc

* Namespace your assets, serve them only when needed

* Flexible and distributed cache

* Transparent preprocessor (for example, `.coffee -> .js` or es6 modules to todays javascript without a hassle)

* Push CSS changes to the browser using Socket.IO 1.x.x in development mode

* Reuse server code in the browser and vice-versa without extra steps

* API consistency and fluent interface

* Reliable. Piler as module shouldn't be your concern, it doesn't affect your application.

* Focuses on [D.R.Y.](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself), [IoC](http://en.wikipedia.org/wiki/Inversion_of_control)
and [Strategy](http://en.wikipedia.org/wiki/Strategy_pattern) paradigms.

* [Check the documentation][]

#### Piler is written following principles in mind:

* Creating best possible production setup for assets should be as easy as
including script/link to a page.

* Namespaces. You don't want to serve huge blob of admin view code for all
anonymous users.

* Support any type of files. No need to create special structure for your
assets. Just include your jQueries, html, stylesheets or whatever.

* Preprocessor languages are first class citizens. Eg. Just change the file
extension to .coffee to use CoffeeScript. That's it. No need to worry about
compiled files.

* Use heavy caching headers. Browser caches are killed automatically using the hash
sum of the assets.

* Awesome development mode. Build-in support for pushing CSS changes to
browser using Socket.IO.

## Whats new in 1.0.0

Version 1.x is almost a complete rewrite from the 0.x versions. A lot changed since Node.js community
and some 'best practices' have emerged, a lot of great tools and of course, with great power,
comes great responsibility. On the verge of generators and an avalanche of functional code (namely Promises)
it needed to be done.

Piler 1.x aims to be completely flexible and expose as many API possible to ensure
community modules can be quickly used along with Piler. By modularizing the asset management 'inner'
workings, it can achieve more testable and maintainable code. With the module interface, modules
can set minifiers, managers, compilers, serializable objects, all in one package.

Also, the new code is well tested and commented, so it's not a blackbox.

This is a big change, and it's __completely__ not backward compatible with 0.x.

#### Migrating

* `createCSSManager` and `createJSManager` are gone, instantiation should be done using the factory method, as
`createManager('js')` and `createManager('css')`, respectively, for example.

* `JSManager.liveUpdate` is gone, use `Piler.LiveCSS.init(jsmanager, cssmanager, httpserver, ioserver);`

* `manager.pileUp()` is gone and called `manager.contents()`. There's no need to call `contents()` on
the manager now, unless you want to output to a directory. This function is always asynchronous because
the time it might take and the I/O it causes may take sometime.

* Pile now has an internal file cache, so that the contents can live between server restarts.
If you prefer to use a memory cache, like memcached or replicate it to other servers and act as a in-memory
CDN, you can roll your own.

* `renderTags` is now called `render`, and it's asynchronous (returns a promise or you can use a callback),
and instead of variadic arguments, it takes an array.
eg: `js.renderTags('admin','utils');` to `js.render(['admin','utils']);`

### Community modules / plugins

* None yet, create one, put it in the readme and make a PR!

## Awesome Asset Manager for Node.js

*Piler* allows you to manage all your assets cleanly and directly from code.
It will concatenate and minify them in production and it takes care of rendering
the tags. The idea is to make your pages load as quickly as possible.

So why create a yet another asset manager? Because Node.js is special. In
Node.js a JavaScript asset isn't just a pile of bits that are sent to the
browser. It's code. It's code that can be also used in the server and I think
that it's the job of asset managers to help with it.

So in *Piler* you can take code directly from your Javascript objects, not just
from JavaScript files.

Copying things from Rails is just not enough. This is just a one reason why
*Piler* was created.

Server-side code:

```javascript
clientjs.addOb({BROWSER_GLOBAL: {
    aFunction: function() {
        console.log("Hello I'm in the browser also. Here I have", window, "and other friends");
    }
}});
```

You can also tell *Piler* to directly execute some function in the browser:

```javascript
clientjs.addExec(function() {
    BROWSER_GLOBAL.aFunction();
    alert("Hello" + window.navigator.appVersion);
});
```

You can even add custom language names mixed in the Javascript code by signaling a processor, and it will be
served as Javascript, plus it can be reused in Node.js as well

```javascript
var obj = clientjs.addMultiline(function() {/*
  ->
    coffee = 'very versatile library'
    console.log "I'm a #{coffee}"
    coffee
*/}, {processors:{coffeescript:{}}, name:'coffeestuff', namespace:'usefulstuff'});

obj.contents().then(function(code){
  /* code is:

    (function(){
      return function(){
        coffee = 'very versatile library';
        console.log("I'm a " + coffee);
        return coffee;
      };
    }).call(this);
   */
});
```

**Full example Express 3.x and 4.x**

```javascript
var app = require('express')(),
    http = require('http'),
    Piler = require('piler'),
    livecss = Piler.LiveCSS;

var clientjs = piler.createManager('js');
var clientcss = piler.createManager('css');

var srv = http.createServer(app);

app
    .use(clientjs.middleware())
    .use(clientcss.middleware())
    ;

clientcss.addFile(__dirname + "/style.css");

clientjs.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js");
clientjs.addFile(__dirname + "/client/hello.js");
clientjs.addWildcard(__dirname + "/client/*-es6.js");

livecss.init(clientjs, clientcss, srv, require('socket.io')(srv));

clientjs.addOb({ VERSION: "1.0.0" });

clientjs.addExec(function() {
    alert("Hello browser" + window.navigator.appVersion);
});

app.get("/", function(req, res){

    res.piler.render("index.jade", {
        layout: false,
        js: clientjs.render(),
        css: clientcss.render()
    });
});

srv.listen(8080);
```

## Namespaces

The example above uses just a one pile. The global pile.

If you for example want to add big editor files only for administration pages
you can create a pile for it:

```javascript
clientjs.addFile(__dirname + "/editor.js", {namespace: "admin"});
clientjs.addFile(__dirname + "/editor.extension.js", {namespace: "admin"});
```

This will add file `editor.js` and `editor.extension.js` to a admin pile. Now you
can add that to your admin pages by using giving it as parameter for
*render*.

```javascript
js.render('admin');
```

This will render script-tags for the `global` pile and the `admin` pile.
`js.render` and `css.render` can take variable amount of arguments.
Use `js.render(['pile1', 'pile2', ...])` to render multiple namespaces

Piling works just the same with other asset types, css or html.

You can disable the rendering of `global` pile by using `js.render(['admin'], {disableGlobal: true});`

## Express Middleware

Although you don't need to use the middleware that comes with Piler, you can
use it to speed up development.

The Express `piler` namespace on the response parameter have an special `render`
function that can handle promises and generators! A very nice extra and adds the
possibility for future proof code.

```javascript
app.get('/', function(req, res){
    res.piler.render('view', {
        promiseValue: SomePromiseReturningFunction('w00t'),
        generator: SomeGeneratorReturningFunction(),
        plainValue: 10
    });
});
```

The call from `res.piler.render` is passed as-is to express original `res.render` function.
You can add functions to the `piler` response namespace by overloading the
`BasePile.prototype.locals` function.

## Sharing code with the server

Ok, that's pretty much what every asset manager does, but with *Piler* you can
share code directly from your server code.

Let's say that you want to share a email-validating function with a server and
the client

```javascript
function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}
```

You can share it with *addOb* method:

```javascript
clientjs.addOb({MY: {
   isEmail: isEmail
   }
});
```

Now on the client you can find the `isEmail` function from `window.MY.isEmail`.

`addOb` takes an object which will be merged to global window-object on the
client. So be carefull when choosing the keys. The object can be almost any
JavaScript object. It will be serialized and sent to the browser. Few caveats:

1. No circular references
2. Functions will be serialized using Function.prototype.toString. So closures and
outside code won't be transferred to the client!

**PRO-TIP**: You can use dot delimited namespaces, and they will be created in the browser, as such: `{'MY.isEmail': isEmail}`
is effectively the same. Doing `{'$.fn.isEmail': isEmail}` can automatically extend jQuery with a function `isEmail` function!

### Pattern for sharing full modules

This is nothing specific to *Piler*, but this is a nice pattern which can be
used to share modules between the server and the client.

```javascript
// share.js
(function(exports){

  exports.test = function(){
       return 'This is a function from shared module';
  };

}(typeof exports === 'undefined' ? this.share = {} : exports));
// "this" in the browser is window, so effectively, window.share
```

In Node.js you can use it by just requiring it as any other module

```javascript
var share = require("./share.js");
```

and you can share it the client using `addFile`:

```javascript
clientjs.addFile(__dirname + "/share.js");
```

Now you can use it in both as you would expect

```javascript
share.test();
```

You can read more about the pattern from [here](http://caolanmcmahon.com/posts/writing_for_node_and_the_browser)

[UMD][] is another way to share full modules between server and client without the need for external tools, like
[browserify][].

## Cache

This whole process isn't worth if your repetitive tasks, such as compiling, concatenating, preprocessing are
done over and over, wasting huge amounts of processing power and memory. For this, you should always rely
on a strong cache mechanism, that you can even use in other parts that aren't related to *Piler*.

By default, Piler uses a file cache, which can help initially with *some* caching, but memory related caches are far better
and usually much faster. This file cache will help retain code between server restarts or even allow many instances of your
application to reach the same previously cached content, since it generates a SHA1 of the identifier, so it can remain unique
even between servers.

But disabling or completely exchaging the existing caches are easy as using `Piler.useCache` and `Piler.getCache`.
Check the [example][] to see how it's done.

## Logging

Sometimes it is nessesary to control pilers output based on the system environment your running your application in.
In default mode Pilers logger will output any information it has by using the "console" javascript object. The following
example shows how to configure a custom logger

### Logger interface

The basic logger facility implements the following methods.

```javascript
exports.debug    = console.debug
exports.notice   = console.log
exports.info     = console.info
exports.warn     = console.warn
exports.warning  = console.warn
exports.error    = console.error
exports.critical = console.error
```

### Inject a custom logger

The following example injects "winston", a multi-transport async logging library into pilers logging mechanism.

```javascript
var piler = require('piler');
var logger = require('winston');
// [More logger configuration can take place here]
var assetTmpDir = path.join(__dirname, 'public');

var js = piler.createManager('js', { outputDirectory: assetTmpDir , logger: logger});
var css = piler.createManager('css', { outputDirectory: assetTmpDir, logger: logger});
var html = piler.createManager('html', { outputDirectory: assetTmpDir, logger: logger});
```

More information about winston can be found [here](https://github.com/flatiron/winston).

## Awesome development mode!

Development and production modes works as in Express. By default the
development mode is active. To activate production mode set `NODE_ENV`
environment variable to *production*.

### Live CSS editing

This is really cool! You don't want to edit CSS at all without this after you
try it!

Because *Piler* handles the script-tag rendering it can add some development
tools when in development mode.

Using Express you can add Live CSS editing in development mode:

```javascript
Piler.LiveCSS.init(jsmanager, clientcss, httpServer);
```

This is similar to [Live.js][], but it does not use polling. It will add
Socket.IO which will push the CSS-changes to your browser as you edit them.

If your app already uses Socket.IO you need to add the *io* app:

```javascript
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

Piler.LiveCSS.init(clientjs, clientcss, server, io);
```

### Script-tag rendering

In development mode every asset in a pile will be rendered as a separate tag.

```javascript
clientjs.addFile(__dirname + "/helpers.js", {name: "named asset"});
clientjs.addFile(__dirname + "/editor.js", {namespace: "admin"});
clientjs.addFile(__dirname + "/editor.extension.js", {namespace: "admin"});
```

For example `js.render('admin')` will render in development mode, to

```html
<script type="text/javascript" src="/pile/dev/global.file-helpers_named_asset.js?v=1317298508710"></script>
<script type="text/javascript" src="/pile/dev/admin.file-editor_ce619a0fe0a1.js?v=1317298508714"></script>
<script type="text/javascript" src="/pile/dev/admin.file-editor_extension_215ba9caf921.js?v=1317298508716"></script>
```

but in production it will render to

```html
<script type="text/javascript" src="/pile/min/f1d27a8d9b92447439f6ebd5ef8f7ea9d25bc41c/global.js"></script>
<script type="text/javascript" src="/pile/min/2d730ac54f9e63e1a7e99cd669861bda33905365/admin.js"></script>
```

So debugging should be as easy as directly using script-tags. Line numbers
will match your real files in the filesystem. No need to debug huge minified
Javascript bundle!

**PRO-TIP**: You can, while in production mode, get dev mode url assets as well.

## Example

This [example][] uses ExpressJS 4.x and a global
socket.io instance together with Piler.

## API summary

Code will be rendered in the order you call these functions with the exception
of assets that are set with `options.asIs` to true, which will be rendered as first.

### Piler.createManager

Can take an optional configuration object as an argument with following keys.

```javascript
var jsclient = piler.createManager('js', {
    outputDirectory: __dirname + "/mydir",
    urlRoot: "/my/root"
});
```

##### logger

Set your logger

##### cacheKeys

Enable cache busting query string `?v=Date.now()` on development strings

##### volatile

Create a volatile pile that as soon the asset is served, it's removed from memory.

##### urlRoot

Url root to which Piler's paths are appended. For example urlRoot "/my/root"
will result in following script tag:

```html
<script type="text/javascript" src="/my/root/min/f4ec8d2b2be16a4ae8743039c53a1a2c31e50570/code.js" ></script>
```

##### outputDirectory

If specified *Piler* will write the minified assets to this folder. Useful if you want to share your assets
from Apache, nginx, lighttpd etc. instead of directly serving from Piler's Express/Connect middleware.

For all the possible configurations and managers, [Check the documentation][].

### Processors

You can easily add new processor by doing, for example, compiling livescript to .js:

```javascript
var Piler = require('piler');

Piler.addProcessor('livescript', function(){
  var livescript = require('LiveScript');

  // this is the initialization function, called once, you must return a rendering
  // object
  return {
    pre: {
      render: function(code, asset, options){
        return livescript.compile(code);
      },
      condition: function(asset) {
        return asset.options.filePath && Piler.utils.extension(asset.options.filePath) === 'ls';
      }
    }
  };
});

piler.addFile(__dirname + '/file.ls', {processors:{livescript:{/* can set processor options */}});
```

You may edit processor default options by editing the `defaults` member, for example, in coffeescript:

```javascript
Piler.getProcessor('coffeescript').pre.defaults = {bare: false};
```

This is an application wide modification.

You can also exchange/change the existing processors in, for example,
the `js` manager (that defaults to `es6` and `coffeescript`)

```javascript
// adding livescript for the ready-to-use processors
Piler.getManager('js').prototype.processors.livescript = {};
```

From now on, you can use livescript files without the need to manually setting the `processors` option

#### Using the power of composable interfaces

Since the promise interface is in core of Piler, you can compose a cascade of promise and non-promise interfaces
together, returning synchronous values and adding them to the promise chain.

But it also comes with a `stream` method, so you can pipe the contents of the manager to another stream:

```javascript
var
  Piler = require('piler'),
  js = Piler.createManager('js');

js
  .addOb({'some.namespace': thatFn})
  .addFile(__dirname + '/file.coffee')
  .stream()
  .pipe(require('someTransformStreamModule'))
  .pipe(fs.createWriteStream('/transformed-bundle.js'));
```

This enables you to use any third party solution alongside with *Piler*.

#### Supported out-of-the-box

JavaScript:

* [CoffeeScript][] (by default, files with `.coffee` extension)
* [ES6][] (by default, files with `es6` in the filename)

CSS:

* [Stylus][] with [nib][] (npm install stylus nib)
* [LESS][] (npm install less)

## Installing

```bash
npm install piler
```

## Print debug

This module uses the `debug` module, and you can output console debug output by using

```bash
export DEBUG=piler:*
```

So that you can see development messages. You can filter out specific debug messages by using:

```bash
export DEBUG=piler:main
```

## Source code

Source code is licenced under [The MIT License](https://github.com/epeli/piler/blob/master/LICENSE) and it is hosted
on [Github](https://github.com/epeli/piler).

## Contact

Questions and suggestions are very welcome

- [Esa-Matti Suuronen](http://esa-matti.suuronen.org/)
- esa-matti [aet] suuronen dot org
- [EsaMatti](https://twitter.com/#!/EsaMatti) @ Twitter
- Epeli @ freenode/IRCnet

[Express]: http://expressjs.com/
[example]: https://github.com/epeli/piler/blob/master/examples/app.js
[browserify]: https://github.com/substack/node-browserify
[Check the documentation]: https://epeli.github.io/piler
[UMD]: https://github.com/umdjs/umd
[ES6]: https://github.com/google/traceur-compiler
[Node.js]: http://nodejs.org/
[Live.js]: http://livejs.com/
[LESS]: http://lesscss.org/
[Stylus]: http://learnboost.github.com/stylus/
[nib]: https://github.com/visionmedia/nib
[CoffeeScript]: http://jashkenas.github.com/coffee-script/