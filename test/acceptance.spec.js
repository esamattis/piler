'use strict';

var CSSLint, async, port, r, request, rules, servers, type, validateCSS, zombie, _fn, _i, _len;

async = require("async");
request = require("request");
zombie = require("zombie");
CSSLint = require("csslint").CSSLint;

rules = CSSLint.getRules().filter(function (rule){
  return rule.id === "errors";
});

CSSLint.clearRules();

for (_i = 0, _len = rules.length; _i < _len; _i++) {
  r = rules[_i];
  CSSLint.addRule(r);
}

validateCSS = CSSLint.verify;

servers = {
  development: 7000,
  production : 7001
};

_fn = function (type, port){
  var fetchPage;

  fetchPage = function (path){
    return function (done){
      this.browser = new zombie();
      this.httpRoot = "http://localhost:" + port;

      this.browser.visit(this.httpRoot + path).then(function (){
        done();
      }, function (err){
        done(err);
      });
    };
  };

  describe("JS assets in " + type + " server", function (){

    before(fetchPage("/"));
    after(function(){
      this.browser.close();
    });

    it("Can share plain js files from fs", function (){
      expect(this.browser.window["js fs"]).to.equal(true);
    });

    it("can share raw js strings", function (){

      expect(this.browser.window["raw js"]).to.equal(true);
    });

    it("has no namespaced raw js here", function (){

      expect(this.browser.window["raw namespace js"]).to.be.an('undefined');
    });

    it("Coffee script files get compiled transparently", function (){

      expect(this.browser.window["coffee fs"]).to.equal(true);
    });

    it("addOb adds global variables", function (){

      expect(this.browser.window["addOb global"]).to.equal(true);
    });

    it("addOb does not override namespace objects", function (){

      expect(this.browser.window.namespaceob.second).to.equal(true, "second addOb missing");
      expect(this.browser.window.namespaceob.first).to.equal(true, "first addOb missing");
    });

    it("js.addExec gets executed", function (){

      expect(this.browser.window["js exec"]).to.equal(true);
    });

    it("addUrl can load assets from remote servers", function (){

      expect(this.browser.window["remote script"]).to.equal(true);
    });

    it("No namespaced js here", function (){

      expect(this.browser.window["namespace"]).to.be.an('undefined');
    });

  });

  describe("Namespaced JS assets in " + type + " server", function (){

    before(fetchPage("/namespace"));
    after(function(){
      this.browser.close();
    });

    it("We have namaspaced js here", function (){

      expect(this.browser.window["namespace"]).to.equal(true);
    });

    it("We have also global js", function (){

      expect(this.browser.window["js fs"]).to.equal(true);
    });

    it("namespaced js.addExec gets executed", function (){

      expect(this.browser.window["namespace js exec"]).to.equal(true);
    });

    it("can share raw js strings in namespaces", function (){

      expect(this.browser.window["raw namespace js"]).to.equal(true);
    });
  });


  describe("CSS assets in " + type + " server", function (){

    before(fetchPage("/"));
    after(function(){
      this.browser.close();
    });

    it("We have css links", function (){
      var $;
      $ = this.browser.window.jQuery;

      expect($("link[rel='stylesheet']").length).to.be.above(0);
    });

    it("has valid CSS", function (done){
      var $, cssUrls;
      $ = this.browser.window.jQuery;

      cssUrls = $("link[rel='stylesheet']").map(function (){
        return this.href;
      });

      async.reduce(cssUrls, "", (function (_this){
        return function (memo, path, cb){

          request(_this.httpRoot + path, function (err, res, body){
            expect(res.statusCode).to.be(200, "" + path + " is missing");

            if (err) {
              return cb(err);
            }
            cb(null, memo + body);
          });
        };
      })(this), function (err, css){
        var result;
        expect(err).to.not.be.ok();
        result = validateCSS(css, rules);
        expect(result.messages.length).to.be(0, "" + (util.inspect(result.messages)));
        done();
      });

    });

    it('elements have been hidden', function(){
      var $ = this.browser.window.jQuery;
      expect($('#plain').is(':hidden')).to.be(true);
      expect($('#stylus').is(':hidden')).to.be(true);
      expect($('#less').is(':hidden')).to.be(true);
      expect($('#raw').is(':hidden')).to.be(true);
      expect($('#namespaced').is(':hidden')).to.be(true);
      expect($('#stylys_import').is(':hidden')).to.be(true);
      expect($('#less_import').is(':hidden')).to.be(true);
    });
  });

};

describe('acceptance', function(){
  for (type in servers) {
    _fn(type, servers[type]);
  }
});
