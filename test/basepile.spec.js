'use strict';

var _fn, _i, _len, piles;

piles = [Piler.getPile('js'), Piler.getPile('css'), Piler.getPile('html')];

_fn = function (Pile){

  describe('addFile works as expected in ' + Pile.name, function (){
    var dummyPath;
    dummyPath = '/foo/bar';

    it('and adds up to one file', function (){
      var js;

      js = new Pile();
      js.addFile(dummyPath);
      expect(js.assets.length).to.be(1);
    });

    it('and cannot make duplicates', function (){
      var js;

      js = new Pile();
      js.addFile(dummyPath);
      js.addFile(dummyPath);
      expect(js.assets.length).to.be(1);
    });
  });

  describe('addUrl works as expected in ' + Pile.name, function (){
    var dummyUrl;
    dummyUrl = 'http://example.com/test.js';

    it('and adds up to one url', function (){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl);

      expect(js.assets.length).to.be(1);
    });

    it('and cannot make duplicates', function (){
      var js;
      js = new Pile();
      js.addUrl(dummyUrl);
      js.addUrl(dummyUrl);
      expect(js.assets.length).to.be(1);
    });
  });

  describe('addMultiline works as expected in ' + Pile.name, function (){
    var dummyFn;
    dummyFn = function(){
      /*
        <testing>
      */
    };

    it('and adds up to one multiline', function (){
      var js;
      js = new Pile();
      js.addMultiline(dummyFn);

      expect(js.assets.length).to.be(1);
    });

    it('and cannot make duplicates', function (){
      var js;
      js = new Pile();
      js.addMultiline(dummyFn);
      js.addMultiline(dummyFn);
      expect(js.assets.length).to.be(1);
    });
  });

  describe('addRaw works as expected in ' + Pile.name, function (){

    it('and adds up to one raw', function (){
      var js;
      js = new Pile();
      js.addRaw('dummy');

      expect(js.assets.length).to.be(1);
    });

    it('and cannot make duplicates', function (){
      var js;
      js = new Pile();
      js.addRaw('dummy');
      js.addRaw('dummy');

      expect(js.assets.length).to.be(1);
    });
  });

};

describe('basepile', function(){
  for (_i = 0, _len = piles.length; _i < _len; _i++) {
    _fn(piles[_i]);
  }

  describe('instance', function(){

    it('throws', function(){
      var base = Piler.Main.BasePile.prototype;
      expect(base.add).to.throwError();
    });

  });

});
