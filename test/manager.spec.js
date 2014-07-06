'use strict';

var _fn, _i, _len, managers, Main = Piler.Main;

describe('manager', function(){

  it('adds and removes managers', function(){
    var spy = sinon.stub();
    function f(){}
    spy.returns(f);
    Main.addManager('doh', spy);
    expect(spy.calledWith(Piler)).to.be(true);
    expect(Main.addManager('doh', spy)).to.be(f);
    Main.removeManager('doh');
    Main.removeManager('doh');
    expect(Main.getManager('doh')).to.be.an('undefined');
  });

  describe('createManager', function(){
    it('throws on non registered manager', function(){
      expect(function(){
        Main.createManager('dummy', 'DummyManager', {});
      }).to.throwError();

    });

    it('fallback to development when no NODE_ENV', function(){
      Main.addManager('dummy', function(){
        return Main.getPile('js');
      });

      var dummy = Main.createManager('dummy', 'DummyManager', {env: 'production'});
      expect(dummy.options.env).to.be('production');

      var currentEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      dummy = Main.createManager('dummy', 'DummyManager');
      expect(dummy.options.env).to.be('development');

      dummy = Main.createManager('dummy', {env: 'production'});
      expect(dummy.options.env).to.be('production');

      process.env.NODE_ENV = currentEnv;
    });
  });

  describe('render', function(){

    it('can deal with promise values', function(done){
      var response = {
        render: function(name, locals, callback){
          expect(name).to.be('index');

          expect(locals).to.eql({
            h: 10,
            j: 100,
            u: 'asdf'
          });

          expect(callback()).to.be(true);

          done();
        }
      };

      var fn = Main.PileManager.prototype._render(response);

      fn('index', {
        h: Piler.utils.Promise.resolve(10),
        j: new Piler.utils.Promise(function(resolve){
          resolve(100);
        }),
        u: 'asdf'
      }, function(){
        return true;
      });
    });
  });

  it('adds and removes piles', function(){
    var spy = sinon.stub();
    function f(){}
    spy.returns(f);
    Main.addPile('doh', spy);
    expect(spy.calledWith(Piler)).to.be(true);
    expect(Main.addPile('doh', spy)).to.be(f);
    Main.removePile('doh');
    Main.removePile('doh');
    expect(Main.getPile('doh')).to.be.an('undefined');
  });

  it('can make a stream out of contents', function(done){
    var
      js = Piler.createManager('js', {env: 'production', commentLines: false}),
      stream = Piler.utils.through(null, function(buf){
        expect(buf.toString()).to.match(/some\.namespace/);
        done();
      });

    js
    .addOb({'some.namespace': function(){
      return 'w00t';
    }})
    .addFile(__dirname + '/fixtures/require.js')
    .contents()
    .then(function(arr){
      stream.end(arr.join(''));
    });
  });

  describe('middleware', function(){
    var supertest = require('supertest');
    var express = require('express');
    var types = ['js','css','html'];
    var i,len = types.length;

    function fn(type) {
      describe('for ' + type, function(){
        beforeEach(function(){
          this.app = express();
          var spy = this.spy = sinon.spy();
          this.manager = Piler.createManager(type);

          this.app.use(this.manager.middleware());
          this.app.get('*', function(req, res, next){
            spy();
            res.end('ok');
          });
        });

        it('should skip when doesnt match any asset', function(done){
          var self = this;

          supertest(self.app)
            .get('/')
            .expect(200)
            .end(function(err, res){
              expect(self.spy.called).to.be(true);
              done(err);
            });
        });

        it('should skip when no asset is asked', function(done){
          var self = this;

          supertest(self.app)
            .get('/piler/')
            .expect(200)
            .end(function(err, res){
              expect(self.spy.called).to.be(true);
              done(err);
            });
        });

        it('calls next if anything went wrong', function(){
          var self = this;

          self.manager.middleware({})(null, null, self.spy);
          expect(self.spy.called).to.be(true);
        });

        it('sets content-type header', function(done){
          var self = this;

          self.manager.addRaw('raw', {name: 'path'});

          supertest(self.app)
            .get('/piler/dev/global.raw-path.' + self.manager.type.prototype.ext)
            .expect(200)
            .expect('content-type', self.manager.contentType)
            .end(function(err, res){
              expect(self.spy.called).to.be(false);
              done(err);
            });
        });

        it('wrong extension skips to next', function(done){
          var self = this;

          self.manager.addRaw('raw', {name: 'path'});

          supertest(self.app)
            .get('/piler/dev/global.raw-path.jade')
            .expect(200)
            .end(function(err, res){
              expect(self.spy.called).to.be(true); // falls to catch all
              done(err);
            });
        });

        it('wrong namespace gives 404', function(done){
          var self = this;

          self.manager.addRaw('raw', {name: 'path'});

          supertest(self.app)
            .get('/piler/dev/dummy.raw-path.' + self.manager.type.prototype.ext)
            .expect(404)
            .end(function(err, res){
              expect(self.spy.called).to.be(false); // falls to catch all
              done(err);
            });
        });

      });
    }

    for(i = 0; i < len; i++) {
      fn(types[i]);
    }
  });

});


