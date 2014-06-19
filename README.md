# Piler

[![Build Status](https://secure.travis-ci.org/epeli/piler.svg)](http://travis-ci.org/epeli/piler)
[![Coverage Status](https://coveralls.io/repos/epeli/piler/badge.png)](https://coveralls.io/r/epeli/piler)
[![Dependency Status](https://david-dm.org/epeli/piler.svg)](https://david-dm.org/epeli/piler)

[![NPM](https://nodei.co/npm/piler.svg?downloads=true&stars=true)](https://nodei.co/npm/piler/)

## Feature highlights

  * Promise based interface
  * Minify and concatenate JS and CSS for fast page loads
  * Tag rendering, for example, `<script type="text/javascript">`, `<link>`, `<script type="text/ng-template">`, etc
  * Namespaces
  * Flexible and distributed cache
  * Transparent preprocessor (`.coffee -> .js` without a hassle)
  * Push CSS changes to the browser using Socket.IO 1.x.x in development mode
  * Reuse server code in the browser and vice-versa

## Whats new in 1.0.0

Version 1.x is almost a complete rewrite from the 0.x versions. A lot changed since Node.js community
and some 'best practices' have emerged, a lot of great tools and of course, with great power, 
comes great responsibility. 

Piler 1.x aims to be completly flexible and expose as many API possible to ensure
community modules can be quickly used along with Piler. By modularizing the asset management 'inner' 
workings, we can achieve more testable and maintainable code. With the plugin interface, plugins
can set minifiers, managers, compilers, all in one export etc.

This is a big change, and it's almost completely not backward compatible. But the adaptation of 
existing code shouldn't be a problem. 

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

*Piler* is written following principles in mind:

* Creating best possible production setup for assets should be as easy as
including script/link to a page.
* Namespaces. You don't want to serve huge blob of admin view code for all
anonymous users.
* Support any JS- or CSS-files. No need to create special structure for your
assets. Just include your jQueries or whatever.
* Preprocessor languages are first class citizens. Eg. Just change the file
extension to .coffee to use CoffeeScript. That's it. No need to worry about
compiled files.
* Use heavy caching. Browser caches are killed automatically using the hash
sum of the assets.
* Awesome development mode. Build-in support for pushing CSS changes to
browser using Socket.IO.

**Full example Express 3.x and 4.x**

```javascript
var app = require('express')(),
    http = require('http'),
    piler = require("piler");

var clientjs = piler.createJSManager();
var clientcss = piler.createCSSManager();

var srv = http.createServer(app);

app
    .use(clientjs.middleware(srv))
    .use(clientcss.middleware(srv));

clientcss.addFile(__dirname + "/style.css");

clientjs.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js");
clientjs.addFile(__dirname + "/client/hello.js");

if (process.env.NODE_ENV === 'development') {
    clientjs.liveUpdate(clientcss, require('socket.io')(srv));
}

clientjs.addOb({ VERSION: "1.0.0" });

clientjs.addExec(function() {
    alert("Hello browser" + window.navigator.appVersion);
});

app.get("/", function(req, res){
    res.render("index.jade", {
        layout: false,
        js: clientjs.renderTags(),
        css: clientcss.renderTags()
    });
});

srv.listen(8080);
```


## Namespaces

The example above uses just a one pile. The global pile.

If you for example want to add big editor files only for administration pages
you can create a pile for it:

```javascript
clientjs.addFile("admin", __dirname + "/editor.js");
clientjs.addFile("admin", __dirname + "/editor.extension.js");
```

This will add file editor.js and editor.extension.js to a admin pile. Now you
can add that to your admin pages by using giving it as parameter for
*renderTags*.

```javascript
js.renderTags("admin");
```

This will render script-tags for the global pile and the admin-pile.
`js.renderTags` and `css.renderTags` can take variable amount of arguments.
Use `js.renderTags("pile1", "pile2", ....)` to render multiple namespaces

Piling works just the same with css.

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

You can share it with *addOb* -method:

```javascript
clientjs.addOb({MY: {
   isEmail: isEmail
   }
});
```

Now on the client you can find the isEmail-function from MY.isEmail.

`addOb` takes an object which will be merged to global window-object on the
client. So be carefull when choosing the keys. The object can be almost any
JavaScript object. It will be serialized and sent to the browser. Few caveats:

1. No circular references
2. Functions will be serialized using Function.prototype.toString. So closures
won't transferred to the client!

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

## Logging

Sometimes it is nessesary to control pilers output based on the system environment your running your application in. 
In default mode Pilers logger will output any information it has by using the "console" javascript object. The following example shows
how to configure a custom logger  

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

var js = piler.createJSManager({ outputDirectory: assetTmpDir , "logger": logger});
var css = piler.createCSSManager({ outputDirectory: assetTmpDir, "logger": logger});
```

More information about winston can be found [here](https://github.com/flatiron/winston).

## Awesome development mode!

Development and production modes works as in Express. By default the
development mode is active. To activate production mode set NODE\_ENV
environment variable to *production*.

### Live CSS editing

This is really cool! You don't want to edit CSS at all without this after you
try it!

Because *Piler* handles the script-tag rendering it can add some development
tools when in development mode.

Using Express you can add Live CSS editing in development mode:

```javascript
if (process.env.NODE_ENV === 'development') {
   clientjs.liveUpdate(clientcss, io);
}
```

This is similar to [Live.js][], but it does not use polling. It will add
Socket.IO which will push the CSS-changes to your browser as you edit them.

If your app already uses Socket.IO you need to add the *io*-object as second
parameter to liveUpdate:


```javascript
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

clientjs.liveUpdate(clientcss, io);
```

### Script-tag rendering

In development mode every JS and CSS file will be rendered as a separate tag.

For example `js.renderTags("admin")` will render

```javascript
clientjs.addFile(__dirname + "/helpers.js");
clientjs.addFile("admin", __dirname + "/editor.js");
clientjs.addFile("admin", __dirname + "/editor.extension.js");
```

in development mode, to

```html
<script type="text/javascript" src="/pile/dev/global.file-helpers.js?v=1317298508710" ></script>
<script type="text/javascript" src="/pile/dev/admin.file-editor.js?v=1317298508714" ></script>
<script type="text/javascript" src="/pile/dev/admin.file-editor.extension.js?v=1317298508716" ></script>
```

but in production it will render to

```html
<script type="text/javascript"  src="/pile/min/f1d27a8d9b92447439f6ebd5ef8f7ea9d25bc41c/global.js"  ></script>
<script type="text/javascript"  src="/pile/min/2d730ac54f9e63e1a7e99cd669861bda33905365/admin.js"  ></script>
```

So debugging should be as easy as directly using script-tags.  Line numbers
will match your real files in the filesystem. No need to debug huge Javascript
bundle!

## Print debug

This module uses the `debug` module, and you can output console debug output by using

```bash
export DEBUG=piler:*
```

So that you can see development messages. You can filter out specific debug messages by using:

```bash
export DEBUG=piler:minify
```

## Example

This [example](https://github.com/epeli/piler/blob/master/examples/app.js) uses ExpressJS 4.x and a 
custom logger (winston) and a global socket.io instance together with Piler.

## API summary

Code will be rendered in the order you call these functions with the exception
of `addUrl` which will be rendered as first.

### createJSManager and createCSSManager

Can take an optional configuration object as an argument with following keys.

```javascript
var jsclient = piler.createJSManager({
    outputDirectory: __dirname + "/mydir",
    urlRoot: "/my/root"
});
``` 

#### urlRoot

Url root to which Piler's paths are appended. For example urlRoot "/my/root"
will result in following script tag:

```html
<script type="text/javascript" src="/my/root/min/f4ec8d2b2be16a4ae8743039c53a1a2c31e50570/code.js" ></script>
```

#### outputDirectory

If specified *Piler* will write the minified assets to this folder. Useful if
you want to share you assets from Apache, nginx, lighttpd etc. instead of directly serving from
Piler's Connect middleware.

### JavaScript pile

#### addFile( [namespace], path to a asset file )

File on filesystem.

#### addUrl( [namespace], url to a asset file )

Useful for CDNs and for dynamic assets in other libraries such as socket.io.

#### addOb( [namespace string], any Javascript object )

Keys of the object will be added to the global window object. So take care when
choosing those.  Also remember that parent scope of functions will be lost.

You can also give a nested namespace for it

```javascript
clientjs.addOb({"foo.bar": "my thing"});
```

Now on the client "my thing" string will be found from window.foo.bar.

The object will be serialized at the second it is passed to this method so you
won't be able modify it other than between server restarts. This is usefull for
sharing utility functions etc.

Use `res.addOb` to share more dynamically objects.

#### addExec( [namespace], Javascript function )

A function that will executed immediately in browser as it is parsed. Parent
scope is also lost here.

#### addRaw( [namespace], raw Javascript string )

Any valid Javascript string.

NOTE: Don't use `'global'` as your namespace, as it will conflict with the internal
namespace of Piler.

### CSS pile

These are similar to ones in JS pile.

#### addFile( [namespace], path to a asset file )

CSS asset on your filesystem.

#### addUrl( [namespace], url to a asset file )

CSS asset behind a url. Can be remote too. This will be directly linked to you
page. Use addFile if you want it be minified.

#### addRaw( [namespace], raw CSS string )

Any valid CSS string.

NOTE: Don't use `'global'` as your namespace, as it will conflict with the internal
namespace of Piler.

## Preprocessors

You can easily add new compilers by doing, for example, compiling livescript (.ls files) to .js:
 
```javascript
var piler = require('piler');

piler.addCompiler('ls', function(){
    var livescript = require('LiveScript');
    
    // this is the initialization function, called once, you must return a rendering 
    // object
    return {
        render: function(filename, code, cb){
            try {
                code = livescript.compile(code);
                cb(null, code);
            } catch (e) {
                cb(e);
            }
        },
        targetExt: 'js' // this is optional in some cases, for this example, we need to convert .ls to .js
    };
});
```

### JavaScript

For JavaScript the only supported one is [CoffeeScript][] and the compiler is
included in *Piler*.

### CSS

CSS-compilers are not included in *Piler*. Just install what you need using [npm][].

* [Stylus][] with [nib][] (npm install stylus nib)
* [LESS][] (npm install less)

Adding support for new compilers should be [easy](https://github.com/epeli/pile/blob/master/lib/compilers.js).

## Installing

From [npm][]

```bash
npm install piler
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
[Node.js]: http://nodejs.org/
[Live.js]: http://livejs.com/
[LESS]: http://lesscss.org/
[Stylus]: http://learnboost.github.com/stylus/
[nib]: https://github.com/visionmedia/nib
[npm]: http://npmjs.org/
[CoffeeScript]: http://jashkenas.github.com/coffee-script/