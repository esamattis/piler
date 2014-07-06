'use strict';

var Cache = Piler.Cache;

function randomIdentifier() {
  return ((Math.random() * 1000) + 2213).toString();
}

describe('cache', function(){

  describe('default cache', function(){
    it('uses the filesystem by default', function(done){
      var identifier = randomIdentifier();
      var spy = sinon.spy();

      Cache.cache(identifier, function(){
        spy();
        return '1';
      }, 'contents').then(function(cached){
        expect(cached).to.be('1');

        return Cache.cache(identifier, function(){
          spy();
          return '2';
        }, 'contents');
      }).then(function(cached){
        expect(cached).to.be('1');
        return Cache.cache(identifier, function(){
          spy();
          return '3';
        }, 'contents');
      }).then(function(cached) {
        expect(cached).to.be('1');
        expect(spy.callCount).to.be(1);
      }).done(done);
    });

    it('passes through when cache not found', function(done){
      var spy = sinon.spy();

      var fn = function(value){
        return Cache.cache('fdsa', function(){
          spy();
          return value;
        }, 'nope');
      };

      fn('123').then(function(cached){
        expect(cached).to.be('123');
        return fn('456');
      }).then(function(cached){
        expect(cached).to.be('456');
        return Cache.cache('fdsa', function(){ return '567'; });
      }).then(function(cached){
        expect(cached).to.be('567');
        expect(spy.callCount).to.be(2);
      }).done(done);
    });

    it('can be disabled', function(done){
      var spy = sinon.spy();
      var cache = Cache.getCache('contents');

      cache.enabled = false;

      var fn = function(value){
        return Cache.cache('fdsa', function(){
          spy();
          return value;
        }, 'contents');
      };

      fn('123').then(function(cached){
        expect(cached).to.be('123');
        return fn('345');
      }).then(function(cached){
        expect(cached).to.be('345');
        expect(spy.callCount).to.be(2);
      }).done(function(){
        cache.enabled = true;
        done();
      });
    });

    describe('dual API', function(){

      it('gives the correct result', function(done){
        var spy = sinon.spy();

        Cache.cache(randomIdentifier(), function(){
          spy();
          return '4321';
        }, 'contents', function(err, code){
          expect(err).to.be(null);
          expect(code).to.be('4321');
          expect(spy.called).to.be(true);
          done();
        });

      });

      it('can catch errors', function(done){
        var spy = sinon.spy();

        Cache.useCache('lolo', function(hash, callback){
          return callback(function(err, code){
            expect(err.message).to.be('oops2');
            throw err;
          });
        });

        Cache.cache(randomIdentifier(), function(){
          spy();
          throw new Error('oops');
        }, 'contents', function(err, code){
          expect(err.message).to.be('oops');
          expect(code).to.not.be.ok();
          expect(spy.called).to.be(true);

          Cache.cache(randomIdentifier(), function(){
            return Piler.utils.Promise.reject(new Error('oops2'));
          }, 'lolo', function(err, result){
            expect(err.message).to.be('oops2');
            expect(code).to.not.be.ok();
            done();
          });
        });

      });

    });
  });

  describe('custom calback', function(){
    it('all types', function(done){
      var id = randomIdentifier(), _hash = Piler.Serialize.sha1(id, 'hex'), spy = sinon.spy();

      var originals = {
        'contents':{callback:null,enabled:true},
        'pre':{callback:null,enabled:true},
        'post':{callback:null,enabled:true}
      };

      for (var x in originals) {
        originals[x].callback = Cache.getCache(x).callback;
      }

      var memory = {};

      Cache.useCache(function(hash, fnCompress){
        spy();
        expect(hash).to.be(_hash);
        if (typeof memory[hash] === 'undefined') {
          return fnCompress().then(function(code){
            spy();
            expect(code).to.be('f');
            return (memory[hash] = code);
          });
        } else {
          return memory[hash];
        }
      });

      Cache.cache(id, function(){
        return 'f';
      }, 'contents')
      .then(function(contents){
        expect(contents).to.be('f');
        return Cache.cache(id, function(){ return 'g'; }, 'contents');
      })
      .then(function(code){
        expect(code).to.be('f');
      })
      .done(function(){
        for (var x in originals) {
          Cache.useCache([x], originals[x].callback);
        }
        expect(Object.keys(memory)).to.eql([_hash]);
        expect(memory[_hash]).to.be('f');
        expect(spy.callCount).to.be(3);
        done();
      });
    });

    it('can use promises', function(done){
      var id = randomIdentifier(), _hash = Piler.Serialize.sha1(id, 'hex');

      Cache.useCache('dope', function(hash, compress){
        expect(hash).to.be(_hash);
        return compress().then(function(code){
          expect(code).to.be(_hash);
          return code;
        });
      });

      Cache.cache(id, function(){
        return new Piler.utils.Promise(function(resolve){
          setTimeout(function(){
            resolve(_hash);
          }, 0);
        });
      }, 'dope', function(err, code){
        expect(code).to.be(_hash);
        done();
      });
    });

    it('only one type', function(done){
      var id = randomIdentifier(), _hash = Piler.Serialize.sha1(id, 'hex'), spy = sinon.spy();

      Cache.useCache(['gl00b'], function(hash, fnCompress){
        spy();
        expect(hash).to.be(_hash);
        return fnCompress(function(err, code){
          spy();
          if (spy.callCount === 2) {
            expect(code).to.be('f');
          } else {
            expect(code).to.be('g');
          }
          return code;
        });
      });

      Cache.cache(id, function(){
        return 'f';
      }, 'gl00b').then(function(code){
        expect(code).to.be('f');
        return Cache.cache(id, function(){
          return 'g';
        }, 'gl00b');
      }).then(function(code){
        expect(code).to.be('g');
        expect(spy.callCount).to.be(4);
      }).done(done);
    });

  });

  describe('useCache', function(){

    it('throws exception', function(){
      expect(function(){
        Cache.useCache();
      }).to.throwException();
    });

  });

});
