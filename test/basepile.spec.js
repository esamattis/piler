'use strict';

var _fn, _i, _len, piles;

piles = [Piler.getPile('js'), Piler.getPile('css'), Piler.getPile('html')];

_fn = function (Pile){

  describe("addFile works as expected in " + Pile.name, function (){
    var dummyPath;
    dummyPath = "/foo/bar";

    it("and adds up to one file", function (done){
      var js;

      js = new Pile();
      js.addFile(dummyPath).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);
    });

    it("and cannot make duplicates", function (done){
      var js;

      js = new Pile();
      js.addFile(dummyPath).then(function(){
        return js.addFile(dummyPath);
      }).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);

    });
  });

  describe("addUrl works as expected in " + Pile.name, function (){
    var dummyUrl;
    dummyUrl = "http://example.com/test.js";

    it("and adds up to one url", function (done){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);
    });

    it("and cannot make duplicates", function (done){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl).then(function(){
        return js.addUrl(dummyUrl);
      }).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);
    });
  });

  describe("addMultiline works as expected in " + Pile.name, function (){
    var dummyFn;
    dummyFn = function(){
      /*
        <testing>
      */
    };

    it("and adds up to one multiline", function (done){
      var js;
      js = new Pile();
      js.addMultiline(dummyFn).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);
    });

    it("and cannot make duplicates", function (done){
      var js;
      js = new Pile();
      js.addMultiline(dummyFn).then(function(){
        return js.addMultiline(dummyFn);
      }).then(function(){
        expect(js.assets.length).to.be(1);
      }).done(done);
    });
  });
};

describe('basepile', function(){
  for (_i = 0, _len = piles.length; _i < _len; _i++) {
    _fn(piles[_i]);
  }

});
