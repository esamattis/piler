# Piles - Awesome Asset Manager for Node.js and Express

Piles allows you to manage all JavaScript and CSS assets from one place. It
gives you a concept of piles. Pile is a named file that contains selected
pieces of concatenated and minified JavaScript or CSS. Piles will automatically
render script- and style-tags for you.


Piles is written following principles in mind:

  1. Creating best possible production setup for assets should be as easy as
     including script/link to a page.
  1. Support any JS- or CSS-files. No need to create special structure for
     your assets. Just include your jQueries or whatever.
  1. Preprocessor languages are first class citizens. Eg. Just change the file
     extension to .coffee to use CoffeeScript. That's it. No need to worry
     about compiled files.
  1. Use heavy caching. Browser caches are killed automatically by changing the
     script url the the current hash sum of the asset.
  1. Take advantage of special features of Node.js. Share server-side code
     easily with the browser.
  1. Awesome development mode. More on this later.


Simple Express example

    var createServer = require("express").createServer;
    var piles = require("piles");

    var app = createServer();
    var js = piles.createJSManager();
    var css = piles.createCSSManager();

    app.configure(function() {
        js.bind(app);
        css.bind(app);

        css.addFile(__dirname + "/style.css");

        js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js");
        js.addFile(__dirname + "/client/hello.js");
    });


    app.get("/", function(req, res){
        res.render("index.jade", { layout: false });
    });


index.jade:

    !!! 5
    html
      head
        !{renderStyleTags()}
        !{renderScriptTags()}
      body
        h1 Hello Piles!
        #container !{body}


## Piles (namespaces)

The example above uses just a one pile. The global pile.

If you for example want to add big editor files only for administration pages
you can create a pile for it:

    js.addFile("admin", __dirname + "/editor.js");
    js.addFile("admin", __dirname + "/editor.extension.js");

This will add file editor.js and editor.extension.js to a admin pile. Now you
can add that to your admin pages by using giving it as parameter for
*renderScriptTags*.

    !{renderScriptTags("admin")}

This will render script-tags for the global pile and the admin-pile.

Piling works just the same with css.


## Sharing code with the server

Ok, that's pretty much what every asset manager does, but with Piles you can
share code directly from your server code.

Let's say that you want to share a email-validating function with a server and
the client

    function isEmail(s) {
      return !! s.match(/.\w+@\w+\.\w/);
    }

You can share it with *addOb* -method:

    js.addOb({MY: {
       isEmail: isEmail
       }
    });

Now on the client you can find the isEmail-function from MY.isEmail.

*addOb* takes an object which will be merged to global window-object on the
client. So be carefull when choosing the keys. The object can be almost any
JavaScript object. It will be serialized and sent to the browser. Few caveats:

  1. No circural references
  1. Functions will be serialized using Function.prototype.toString. So closures
     won't transferred to the client!


## Awesome development mode!

Development and production modes works as in Express. By default the
development mode is active. To activate production mode set NODE\_ENV
environment variable to *production*.

### Script-tag rendering

In development mode every js- and css-file will be rendered as a separate tag.

For example renderScriptTags("admin") will render

    js.addFile(__dirname + "/helpers.js");
    js.addFile("admin", __dirname + "/editor.js");
    js.addFile("admin", __dirname + "/editor.extension.js");

to

    <script type="text/javascript" src="/piles/js/dev/_global/1710d-helpers.js?v=1317298508710" ></script>
    <script type="text/javascript" src="/piles/js/dev/admin/3718d-editor.js?v=1317298508714" ></script>
    <script type="text/javascript" src="/piles/js/dev/admin/1411d-editor.extension.js?v=1317298508716" ></script>

in development mode, but in production it will render to

    <script type="text/javascript"  src="/piles/js/min/_global.js?v=f1d27a8d9b92447439f6ebd5ef8f7ea9d25bc41c"  ></script>
    <script type="text/javascript"  src="/piles/js/min/admin.js?v=2d730ac54f9e63e1a7e99cd669861bda33905365"  ></script>

So debugging should be as easy as directly using script-tags.

### Live CSS-editing

Because Piles handles the script-tag rendering it can also automatically add
some development tools when in production.

Using Express you can automatically add Live CSS editing:

    app.configure("development", function() {
       js.liveUpdate(css);
    });

This is similar to [Live.js][], but it does not use polling. It will add
socket.io add will push the CSS-updates to your browser as you edit them.

If you app already uses Socket.io you need to add the io-object as second
parameter to liveUpdate:


    var io = require('socket.io').listen(app);
    js.liveUpdate(css, io);


## Examples

https://github.com/epeli/node-piles/blob/master/examples/simple/app.js


## Caveats

js.bind(app) and css.bind(app) will add routes to your app, so you need to add
whatever middlewares  you use before calling these.

## Supported preprocessors

For JavaScript the only supported one is [CoffeeScript][] and the compiler is
included in Piles.

CSS-compilers are not included in Piles. Just install what you need using
[NPM][].

  * [Stylus][] with [nib][] (npm install stylus nib)
  * [LESS][] (npm install less)

Adding support for new compilers should be [easy](https://github.com/epeli/node-piles/blob/master/lib/compilers.coffee).
Feel free to contribute!

## Installing

From [NPM][]

    npm install piles


## Contact

Questions and suggestions are very welcome

- Esa-Matti Suuronen
- esa-matti [aet] suuronen dot org
- Epeli @ freenode/IRCnet



[Express]: http://expressjs.com/
[Node.js]: http://nodejs.org/
[Live.js]: http://livejs.com/
[LESS]: http://lesscss.org/
[Stylus]: http://learnboost.github.com/stylus/
[nib]: https://github.com/visionmedia/nib
[NPM]: http://npmjs.org/
[CoffeeScript]: http://jashkenas.github.com/coffee-script/




