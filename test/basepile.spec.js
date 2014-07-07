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

    it('throws on wrong comment', function(done){
      var pile = new Pile();

      pile.addMultiline(function(){});

      pile.pileUp().catch(function(err){
        expect('' + err).to.match(/failed/);
      }).done(done);
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

  describe('remove works as expected in ' + Pile.name, function(){
    it('removes', function(){
      var pile = new Pile();
      var o = pile.addRaw('dummy');
      expect(pile.assets).to.have.length(1);
      pile.remove(o);
      expect(pile.assets).to.have.length(0);
      pile.remove(o);
      expect(pile.assets).to.have.length(0);
    });

  });

};

describe('basepile', function(){
  for (_i = 0, _len = piles.length; _i < _len; _i++) {
    _fn(piles[_i]);
  }

  var
    Base = Piler.getPile('BasePile');

  describe('instance', function(){

    it('throws', function(){
      var base = Base.prototype;
      expect(base.add).to.throwError();
    });

    describe('getObjects', function(){

      it('gets raw by default', function(done){
        var base = new Base('base');
        base.addRaw('raw');

        base.getObjects().then(function(result){
          expect(result).to.eql(['raw']);
          done();
        });
      });

      it('get path', function(done){
        var base = new Base('base');
        base.addRaw('raw', {name: 'rawed'});

        base.getObjects(false, 'options.name').then(function(result){
          expect(result).to.eql(['rawed']);
          done();
        });
      });

      it('get by type', function(done){
        var base = new Base('base');
        base.addRaw('raw', {name: 'rawed'});
        base.addMultiline(function(){/* adfasd */});

        base.getObjects('raw').then(function(result){
          expect(result).to.eql(['raw']);
          return base.getObjects('raw', false);
        }).then(function(result){
          expect(result).to.have.length(1);
          return base.getObjects('raw', 'nono');
        }).then(function(result){
          expect(result).to.have.length(0);
          return base.getObjects(false, false);
        }).then(function(result){
          expect(result).to.eql([]);
        }).done(done);
      });

      it('dual api', function(done){
        var base = new Base('base');
        base.addRaw('raw');
        base.addMultiline(function(){/*
          asdfa
        */});

        base.getObjects(false, 'contents', function(err, result){
          expect(err).to.not.be.ok();
          expect(result).to.eql(['raw', '\n          asdfa\n        ']);
          done();
        });
      });

    });

  });

});
