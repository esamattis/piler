
# Client-side code sharing and management for Express

**Express-share** is an extension for the [Express][] web framework. It takes
browser script management by the balls.  It handles all the scripts-tags which
are sent to the browser.

The grand scheme is that you can seamlessly write server and client-side code.
You can **embed client-side code in to your Node.js files!** It should be
trivial to change code execution from the server to the client. Also function
and variable sharing is a breeze.

It is also possible to specify a folder from which client-side only
Javascript/CoffeeScript files will be automatically loaded and sent to the
browser.

Express-share is also aware of development and production modes. In development
mode it makes sure that caching won't get in your way etc. In production mode
it takes all the Javascript code and **concatenates them in to a single .js
file, minifies it using [Uglifyjs][]** and caches it in memory.

# Install

    npm install express-share

# Example

Lets start with a small [example][] code to get you excited!


<pre>
var createServer = require("express").createServer;
var addCodeSharingTo = require("express-share").addCodeSharingTo;

function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var app = createServer();
addCodeSharingTo(app);

// Add external script to browser
app.scriptURL("https://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js");

// Share isEmail with the browser
app.share({isEmail: isEmail});

// This function will be actually executed in the browser!
app.exec(function(){
  jQuery(document).ready(function(){
    $("#send").submit(function(e){
      if ( !isEmail($("#email").val()) ) {
        e.preventDefault();
        alert("Bad email!");
      }
    });
  });
});


app.get("/", function(req, res){
  res.share({variable: "You are at application root!"});

  // You can also add client code by request basis
  res.exec(function(){
    alert(variable);
  });

  res.render("index.jade");
});

app.listen(8001);
</pre>

And to achieve all this you only need to call *renderScriptTags* helper in the
head tag of your layout template.


## Code sharing API

###  addCodeSharingTo(Express server object)

Extends Express server object and response objects with *share* and *exec*
methods.


- **returns** Express server object

### server.share([namespace regexp, ] map of variables)

Shares almost any given Javascript object with the browser. Will work for
functions too, but **make sure that you will use only pure functions**. Scope
or the context won't be same in the browser. Cannot handle objects with
circular references.

Code will be shared where the regexp matches on request.url or on every page if
it is omitted.

server.share will be set only once on server startup. So you can only use this
to share general purpose functions and variables. Use response.share to share
variables more dynamically.

- **returns** shared object

#### Examples

    server.share({onEveryPage: "This string will be found on every page"});
    server.share(/^\/subpage.*/, {subPageVariable: "This string is found only from /subpage and its sub pages"});



### server.exec([namespace regexp, ] function)

Executes the given function at page load in the browser as soon as it is loaded
if the given namespace regexp matches. If namespace is omitted the function
will be executed on every page.

Variables shared with server.share() can be found from the parent scope or from
from the context of the function (ie.  this-variable).

Code will be shared where the regexp matches on request.url or on every page if
it is omitted.

- **returns** shared function

#### Example

    server.exec(function()
        alert(onEveryPage);
    });

    server.exec(/^\/subpage.*/, function()
        alert(subPageVariable);
    });



### server.shareFs([namespace regexp, ] path to a script file)

Share given script file from filesystem with the browser. Can be .js or .coffee
file.

Code will be shared where the regexp matches on request.url or on every page if
it is omitted.

- **returns** undefined

#### Example

    server.shareFs(/^\/subpage.*/, __dirname + "myscript.js");

### server.scriptURL(url to a .js file | array of urls)

Executes given Javascript URL in the browser as soon as it is loaded. Will be
executed before any other code.

- **returns** undefined


### response.share(map of variables)

Same as server.share(), but shared object(s) will be dynamically sent to
browser only with this response as inline script.

- **returns** shared object


### response.exec(function)

Same as server.exec(), but the given function will be executed only with this
response as inline script.

Function can access variables shared with response.share() from parent scope,
but not the variables shared by server.share(). Those can be accessed from the
context of the function.

- **returns** shared function


### Dynamic helper *renderScriptTags*

Really Express also registers an essential dynamic helper function,
*renderScriptTags*, for embedding all the script-tags. Just include ouput of
it as raw html in your layout template.

#### Example

views/layout.jade

<pre>
!!! 5
html(lang="en")
  head
    title= title
    !{renderScriptTags()}
  body
    h1= title
    #container !{body}
</pre>


#### Script order

Scripts will be rendered in following order in the browser.

1. server.scriptURL()
1. Scripts automatically loaded from the filesystem in alphabetical order
1. server.shareFs()
1. server.share()
1. server.exec()
1. server.shareFs() namespaced
1. server.share() namespaced
1. server.exec() namespaced
1. response.share()
1. response.exec()

Production mode concatenates 2-5 levels into a single request. Rest will be
served as inline scripts.

### Settings

Code sharing adds an extra setting, *clientscripts* to Express. It allows you
to specify a directory where client-side only scripts can be loaded. They will
be automatically sent to browser in alphabetical order by the
*renderScriptTags* helper. You can also use CoffeeScript files there. They will
be automatically compiled to Javascript.

Default is process.cwd() + "/clientscripts"

#### Example

Modify it by using set.

    app.set("clientscripts", __dirname + "/clientscripts");

# TODOs

- Sanitize script order
- Add tests for script order
- Do not inline namespaced scripts?

# Contact

Questions and suggestions are very welcome

- Esa-Matti Suuronen
- esa-matti [aet] suuronen dot org
- Epeli @ freenode/IRCnet



[Express]: http://expressjs.com/
[Node.js]: http://nodejs.org/
[Zappa]: https://github.com/mauricemach/zappa
[Uglifyjs]: https://github.com/mishoo/UglifyJS
[example]: https://github.com/epeli/reallyexpress/tree/master/examples/simple
