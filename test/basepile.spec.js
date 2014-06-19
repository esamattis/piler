'use strict';

var _fn, _i, _len, piles;

piles = [Piler.JSPile, Piler.CSSPile];

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
  for (_i = 0, _len = piles.length; _i < _len; _i++) {
    _fn(piles[_i]);
  }

  describe('Exceptions', function(){

    it('throws on reserved word', function(){
      var manager = Piler.createJSManager();

      expect(function(){
        manager.addOb('Array', '');
      }).to.throwException(/reserved/);
    });
  });

});
