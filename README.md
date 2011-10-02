# Awesome asset manager for Node.js and Express: node-pile 

*node-pile* allows you to manage all your JavaScript and CSS assets cleanly
directly from code. It will concatenate and minify them in production and it
takes care of rendering the tags as every other proper asset manager.

So why create a yet another asset manager? Because Node.js is special. In
Node.js a JavaScript asset isn't just a pile of bits that is sent to the
browser. It's code. It's code that can be also used in the server and I think
that it's the job of asset managers to help with it. So in *node-pile* you can
take code directly from your Javascript objects, not just from JavaScript
files.

Server-side code:

    js.addOb({BROWSER_GLOBAL: {
        aFunction: function() {
            console.log("Hello I'm in the browser also. Here I have", window, "and other friends");
        }
    }});

You can also tell *node-pile* to directly execute some function in the browser:

    js.addExec(function() {
        BROWSER_GLOBAL.aFunction();
        alert("Hello" + window.navigator.appVersion);
    });


Currently *node-pile* works only with [Express], but other frameworks
are planned as well.


*node-pile* is written following principles in mind:

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
  * Awesome development mode. Build-in support for live CSS reloading.


Full example

    var createServer = require("express").createServer;
    var pile = require("pile");

    var app = createServer();
    var js = pile.createJSManager();
    var css = pile.createCSSManager();



    app.configure(function() {
        js.bind(app);
        css.bind(app);

        css.addFile(__dirname + "/style.css");

        js.addUrl("http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js");
        js.addFile(__dirname + "/client/hello.js");
    });

    js.addOb({ VERSION: "1.0.0" });

    js.exec(function() {
        alert("Hello browser" + window.navigator.appVersion);
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
        h1 Hello node-pile!
        #container !{body}


## Namespaces

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
*renderScriptTags* and *renderStyleTags* can take variable amount of arguments.
Use *renderScriptTags("pile1", "pile2", ....)* to render multiple namespaces

Piling works just the same with css.


## Sharing code with the server

Ok, that's pretty much what every asset manager does, but with *node-pile* you
can share code directly from your server code.

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


### Pattern for sharing full modules

This is nothing specific to *node-pile*, but this is a nice pattern which can
be used to share modules between the server and the client.

share.js

    (function(exports){

      exports.test = function(){
           return 'This is a function from shared module';
      };

    }(typeof exports === 'undefined' ? this.share = {} : exports));

In Node.js you can use it by just requiring it as any other module

    var share = require("./share.js");

and you can share it the client using *addFile*:

    js.addFile(__dirname + "./share.js");

Now you can use it in both as you would expect

    share.test();

You can read more about the pattern from [here](http://caolanmcmahon.com/posts/writing_for_node_and_the_browser)

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

    <script type="text/javascript" src="/pile/js/dev/_global/1710d-helpers.js?v=1317298508710" ></script>
    <script type="text/javascript" src="/pile/js/dev/admin/3718d-editor.js?v=1317298508714" ></script>
    <script type="text/javascript" src="/pile/js/dev/admin/1411d-editor.extension.js?v=1317298508716" ></script>

in development mode, but in production it will render to

    <script type="text/javascript"  src="/pile/js/min/_global.js?v=f1d27a8d9b92447439f6ebd5ef8f7ea9d25bc41c"  ></script>
    <script type="text/javascript"  src="/pile/js/min/admin.js?v=2d730ac54f9e63e1a7e99cd669861bda33905365"  ></script>

So debugging should be as easy as directly using script-tags.

### Live CSS editing

Because *node-pile* handles the script-tag rendering it can also automatically add
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

https://github.com/epeli/node-pile/blob/master/examples/simple/app.js


## API summary

Code will be rendered in the order you call these functions with the exception
of *addUrl* which will be rendered before any other.

### JavaScript pile

#### addFile( [namespace], path to a asset file)

#### addUrl( [namespace], url to a asset file)

Useful for CDNs and for dynamic assets in other libraries such as socket.io.

#### addOb( [namespace], any Javascript object )

Keys of the object will be added as globals. So take care when choosing those.
Also remember that parent scope of functions will be lost.

#### addExec( [namespace], Javascript function )

A function that will executed immediately in browser as it is parsed. Parent
scope is also lost here.

#### addRaw( [namespace], raw Javascript string )



### CSS pile

These are similar to ones in JS pile.


#### addFile( [namespace], path to a asset file)

#### addUrl( [namespace], url to a asset file)

#### addRaw( [namespace], raw CSS string )

### Response middleware

*node-pile* also adds few extra methods to your response objects.

#### res.exec( Javascript function )

Execute this function only on this response.

#### res.share( any Javascript object )

Similar to js.addOb, but only for this response.

NOT IMPLEMENTED YET!


## Supported preprocessors

For JavaScript the only supported one is [CoffeeScript][] and the compiler is
included in *node-pile*.

CSS-compilers are not included in *node-pile*. Just install what you need using
[npm][].

  * [Stylus][] with [nib][] (npm install stylus nib)
  * [LESS][] (npm install less)

Adding support for new compilers should be
[easy](https://github.com/epeli/node-pile/blob/master/lib/compilers.coffee).

Feel free to contribute!

## Installing

From [npm][]

    npm install pile


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
[npm]: http://npmjs.org/
[CoffeeScript]: http://jashkenas.github.com/coffee-script/


