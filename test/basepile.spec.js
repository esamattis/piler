'use strict';

var CSSManager, CSSPile, JSManager, JSPile, Pile, _fn, _i, _len, _ref, _ref1;

_ref = require("../lib/piler");
JSPile = _ref.JSPile;
CSSPile = _ref.CSSPile;
JSManager = _ref.JSManager;
CSSManager = _ref.CSSManager;

_ref1 = [JSPile, CSSPile];

_fn = function (Pile){

  describe("addFile works as expected in " + Pile.name, function (){
    var dummyPath;
    dummyPath = "/foo/bar";

    it("Pile addFile adds up to one file", function (){
      var js;

      js = new Pile();
      js.addFile(dummyPath);

      expect(js.code.length).to.be(1);
    });

    it("Pile addFile cannot make duplicates", function (){
      var js;

      js = new Pile();
      js.addFile(dummyPath);
      js.addFile(dummyPath);

      expect(js.code.length).to.be(1);
    });
  });

  describe("addUrl works as expected in " + Pile.name, function (){
    var dummyUrl;
    dummyUrl = "http://example.com/test.js";

    it("Pile addUrl adds up to one url", function (){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl);

      expect(js.urls.length).to.be(1);
    });

    it("Pile addUrl cannot make duplicates", function (){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl);
      js.addUrl(dummyUrl);

      expect(js.urls.length).to.be(1);
    });
  });
};

describe('basepile', function(){
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    Pile = _ref1[_i];
    _fn(Pile);
  }

  describe('Exceptions', function(){

    it('throws on reserved word', function(){
      var manager = _ref.createJSManager();

      expect(function(){
        manager.addOb('Array', '');
      }).to.throwException(/reserved/);
    });
  });

});
