'use strict';

var Cache = Piler.Cache;

describe('cache', function(){

  it('uses the filesystem by default', function(done){
    var random = ((Math.random() * 1000) + 2213).toString();

    Cache.cache(random, function(){
      return '1';
    }).then(function(cached){
      expect(cached).to.be('1');

      return Cache.cache(random, function(){
        return '2';
      });
    }).then(function(cached){
      expect(cached).to.be('1');
      return Cache.cache(random, function(){
        return '3';
      });
    }).then(function(cached) {
      expect(cached).to.be('1');
    }).done(done);
  });

  it('when not using filesystem it passes through', function(done){
    Cache.options.useFS = false;

    Cache.cache('fdsa', function(){
      return '123';
    }).then(function(cached){
      expect(cached).to.be('123');
    }).done(done);
  });

  it('has dual API', function(done){
    Cache.cache('fdsa', function(){
      return '4321';
    }, function(err, code){
      expect(err).to.be(null);
      expect(code).to.be('4321');
      done();
    });
  });

  it('uses custom callback', function(done){
    Cache.useCache(function(code, hash, fnCompress){
      expect(code).to.be('fdsa');
      expect(hash).to.be('a14fbfb7b88dacd1af65d31bade857bc8e839e46');
      return fnCompress();
    });

    Cache.cache('fdsa', function(){
      return 'f';
    }).then(function(contents){
      expect(contents).to.be('f');
    }).done(done);
  });

  it('can be disabled altogether', function(done){
    Cache.options.enable = false;

    Cache.options.useFS = false;
    sinon.spy(Cache.options, 'cacheCallback');

    Cache.cache('fdas', function(){
      return '123';
    }).then(function(cached){
      expect(cached).to.be('123');
      expect(Cache.options.cacheCallback.called).to.be(false);
    }).finally(function(){
      Cache.options.cacheCallback.restore();
      done();
    });
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
