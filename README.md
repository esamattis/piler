

# Really Express

Really Express is a set of extensions for [Express][] web framework. It focuses
on bringing extraordinary features of [Node.js][] to Express. That is mainly
code sharing between the server and the browser and integrating WebSockets as
first class citizens. Really Express is somewhat inspired by [Zappa][] web DSL.


# Code sharing and management

Really Express takes browser script management by the balls. It handles all the
scripts-tags which are sent to the browser. You can even embed client-side code
directly to your Node.js files!

You can also specify a folder from which client-side only
Javascript/CoffeeScript files will be loaded and sent to the browser.

It is also aware of development and production modes. In development mode it
makes sure that caching won't get in your way etc. In production mode it takes
all the Javascript code and concatenates them in to a sinle .js file and
minifies it using [Uglifyjs][].


Lets start with small [example][] code to get you excited!


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

  // You can also add client code by request basis
  res.exec = function(){
    alert("Only in this path");
  };

  res.render("index.jade");
});

app.listen(8001);
</pre>

And to achieve all this you only need to call *bundleJavascript* helper in the
head tag of your layout template.


## Code sharing API

###  addCodeSharingTo()

Extends Express server object with following methods.

- **params** Express server object
- **returns** Express server object

### .share()

Shares almost any given Javascript object with the browser. Will work for
functions too, but **make sure that you will use only pure functions**. Scope
or the context wont't be same in the browser.

Variables will be added as local variables in browser and also in to a global
*REALLYEXPRESS* object.

- **params** name, object
- **params** object
- **returns** Express server object

### .exec()

Executes the given function in every page in the browser as soon as it is
loaded. Variable "this" in the function will be *REALLYEXPRESS*.

- **params** function
- **returns** Express server object

### .scriptURL()

Executes given Javascript URL in the browser as soon as it is loaded.

- **params** url to a .js file | array of urls
- **returns** Express server object


### res.exec

Really Express also makes "exec" attribute of response objects special.  You
can set it to a function or a array of functions that will be then executed on
the response page.  Variable "this" in the the function will be *REALLYEXPRESS*.


### Dynamic helper *bundleJavascript*

Really Express also registers an essential dynamic helper, *bundleJavascript*,
for embedding all the Javascripts. Just include it as raw html in your layout
template

#### Example

views/layout.jade

<pre>
!!! 5                                
html(lang="en")                      
  head                               
    title= title                     
    !{bundleJavascript}              
  body                               
    h1= title                        
    #container !{body}               
</pre>

### Settings

Code sharing adds an extra setting, *clientscripts* to Express. It allows you
to specify a directory where client-side only scripts can be loaded. They will
be automatically added to browser by *bundleJavascript* helper. You can also
use CoffeeScript files there. They will be automatically compiled to
Javascript.

Default is process.cwd() + "/clientscripts"

#### Example

Modify it by using set.

<pre>
app.set("clientscripts", __dirname + "/clientscripts");
</pre>


# Making WebSockets as first class citizens

Not implemented yet. Will use [Socket.io][].
  
# Contact

Questions and suggestions are very welcome

- Esa-Matti Suuronen
- esa-matti [aet] suuronen dot org
- Epeli @ freenode/IRCnet



[Express]: http://expressjs.com/
[Node.js]: http://nodejs.org/
[Zappa]: https://github.com/mauricemach/zappa
[Uglifyjs]: https://github.com/mishoo/UglifyJS
[Socket.io]: http://socket.io/
[example]: https://github.com/epeli/reallyexpress/blob/master/exexamples/simple/app.js 

