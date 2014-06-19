'use strict';

var Cache;

Cache = require("../lib/cache");

describe('cache', function(){

  it('uses the filesystem by default', function(){
    var random = ((Math.random() * 1000) + 2213).toString();

    var cached = Cache(random, function(){
      return '1';
    });

    expect(cached).to.be('1');
    cached = Cache(random, function(){
      return '2';
    });
    expect(cached).to.be('1');
    cached = Cache(random, function(){
      return '3';
    });
    expect(cached).to.be('1');
  });

  it('when not using filesystem it passes through', function(){
    Cache.options.useFS = false;

    var cached = Cache('fdsa', function(){
      return '123';
    });

    expect(cached).to.be('123');
  });

  it('uses custom callback', function(done){
    Cache.useCache(function(code, hash, fnCompress){
      expect(code).to.be('fdsa');
      expect(hash).to.be('a14fbfb7b88dacd1af65d31bade857bc8e839e46');
      return fnCompress();
    });

    Cache('fdsa', function(){
      done();
    });
  });

  it('can be disabled altogether', function(){
    Cache.options.enable = false;

    Cache.options.useFS = false;
    sinon.spy(Cache.options, 'cacheCallback');

    var cached = Cache('fdas', function(){
      return '123';
    });

    expect(cached).to.be('123');
    expect(Cache.options.cacheCallback.called).to.be(false);

    Cache.options.cacheCallback.restore();
  });

  it('throws exception', function(){
    expect(function(){
      Cache.useCache();
    }).to.throwException();
    expect(function(){
      Cache.useCache(function(){});
    }).to.throwException();
  });

  after(function(){
    Cache.options.enable = true;
    Cache.options.useFS = true;
  });

});
