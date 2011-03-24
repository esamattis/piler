
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

It is also aware of development and production modes. In development mode it
makes sure that caching won't get in your way etc. In production mode it takes
all the Javascript code and **concatenates them in to a single .js file,
minifies it using [Uglifyjs][]** and caches it in memory.


Lets start with a small [example][] code to get you excited!


<pre>
var createServer = require("express").createServer;
var addCodeSharingTo = require("reallyexpress").addCodeSharingTo;

function isEmail(s) {
  return !! s.match(/.\w+@\w+\.\w/);
}

var app = createServer();
addCodeSharingTo(app);

// Add external script to browser
app.scriptURL("https://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js");

// Share isEmail with the browser
app.share("isEmail", isEmail);

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
  res.share("variable", "You are at application root!");

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

###  addCodeSharingTo()

Extends Express server object and response objects with *share* and *exec*
methods.

- **params** Express server object
- **returns** Express server object

### server.share()

Shares almost any given Javascript object with the browser. Will work for
functions too, but **make sure that you will use only pure functions**. Scope
or the context won't be same in the browser. Cannot handle objects with
circular references.

- **params** variable name, object
- or **params** map of variable names and objects
- **returns** shared object

### server.exec()

Executes the given function at every page load in the browser as soon as it is
loaded. Variables shared with server.share() can be found from the parent scope
or from from the context of the function (ie. this-variable).

- **params** function


### server.scriptURL()

Executes given Javascript URL in the browser as soon as it is loaded. Will be
executed before any other code.

- **params** url to a .js file | array of urls


### response.share()

Same as server.share(), but shared object(s) will be sent to browser only with
this response as inline script.

- **params** variable name, object
- or **params** map of variable names and objects
- **returns** shared object

### response.exec()

Same as server.exec(), but the given function will be executed only with this
response as inline script. 

Function can access variables shared with response.share() from parent scope,
but not the variables shared by server.share(). Those can be accessed from the
context of the function.

- **params** function



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
2. Scripts automatically loaded from the filesystem in alphabetical order
3. server.share()
4. server.exec()
5. response.share() as inline script
6. response.exec() as inline script

Production mode concatenates 2-4 levels into a single request.

### Settings

Code sharing adds an extra setting, *clientscripts* to Express. It allows you
to specify a directory where client-side only scripts can be loaded. They will
be automatically sent to browser in alphabetical order by the
*renderScriptTags* helper. You can also use CoffeeScript files there. They will
be automatically compiled to Javascript.

Default is process.cwd() + "/clientscripts"

#### Example

Modify it by using set.

<pre>
app.set("clientscripts", __dirname + "/clientscripts");
</pre>


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
