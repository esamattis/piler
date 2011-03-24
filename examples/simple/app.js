
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
  res.exec(function(){
    alert("Only in this path");
  });

  res.render("index.jade");
});

app.listen(8001);
