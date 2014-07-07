'use strict';

var _fn, _i, _len, managers, Main = Piler.Main;

describe('manager', function(){

  beforeEach(function(){
    // supress logger stuff
    sinon.stub(Piler.Logger, 'info');
  });

  afterEach(function(){
    Piler.Logger.info.restore();
  });

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
      var calls = 0;
      var response = {
        render: function(name, locals, callback){
          if (++calls === 1) {
            expect(name).to.be('index');

            expect(locals).to.eql({
              h: 10,
              j: 100,
              u: 'asdf'
            });

            expect(callback()).to.be(true);
          } else {
            expect(name).to.be('lib');
            expect(locals).to.eql({});
            expect(callback()).to.be(undefined);
          }
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
        fn('lib', function(){
          done();
        });
        return true;
      });
    });

    it('returns the tags', function(done){
      function fn(options){
        options = options || {};
        var manager = Piler.createManager('js', options);

        manager.addMultiline(function(){/*
          // dem leading spaces
        */}, {namespace:'private'});

       return manager;
      }

      fn().render(['private','dummy'], {disableGlobal: true}).then(function(value){
        expect(value).to.match(/src="\/piler\/dev\/private\.multiline/);
        return fn({env: 'production'}).render(['private','dummy'], {disableGlobal: true});
      }).then(function(value){
        expect(value).to.match(/\/piler\/min\/\/private\.js/);
      }).done(done);
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
      PileManager = Piler.getManager('PileManager'),
      base = new PileManager('js', {env: 'production', commentLines: false}),
      stream = Piler.utils.through(null, function(buf){
        expect(buf.toString()).to.match(/some\.namespace/);
        done();
      });

    base
    .addRaw(function(){/*{'some.namespace': function(){
      return 'w00t';
    }}*/}).then(function(){
      return this.addFile(__dirname + '/fixtures/require.js');
    }).then(function(){
      return this.contents();
    }).done(function(arr){
      stream.end(arr.join(''));
    });
  });

  describe('contents', function(){
    function getManager(options){
      var Manager = Piler.getManager('PileManager');
      return new Manager('manager', options);
    }

    it('outputs the contents', function(done){
      var manager = getManager();

      manager
      .addFile(__dirname + '/fixtures/file.js').then(function(){
        return this.addMultiline(function(){/*   asda    */});
      }).then(function(){
        return this.contents();
      }).then(function(code){
        expect(code).to.eql([
          'function longName( argument1 ) {\n  return argument1 + 1;\n}\n\n   asda    '
        ]);
      }).done(done);
    });

    it('outputs some of the contents', function(done){
      var manager = getManager();

      manager
      .addFile(__dirname + '/fixtures/file.js', {namespace: 'true'}).then(function(){
        return this.addMultiline(function(){/*   asda    */});
      }).then(function(){
        return this.contents('true', {disableGlobal: true});
      }).then(function(code){
        expect(code).to.eql([
          'function longName( argument1 ) {\n  return argument1 + 1;\n}'
        ]);
      }).done(done);
    });

    it('has dual API', function(done){
      var manager = getManager();

      manager.addFile(__dirname + '/fixtures/file.js');
      manager.addMultiline(function(){/*   asda    */});

      manager.contents(function(err, code){
        expect(code).to.eql([
          'function longName( argument1 ) {\n  return argument1 + 1;\n}\n\n   asda    '
        ]);
        done();
      });
    });

    it('outputDirectory', function(done){
      var
        _path = Piler.utils.path.join(__dirname, '/ephemeral'),
        manager = getManager({
          outputDirectory: _path
        });

      sinon.stub(Piler.utils.fs, 'writeFileAsync', function(path, code){
        expect(path).to.be(Piler.utils.path.join(_path, 'global'));
        expect(code).to.be('function longName( argument1 ) {\n  return argument1 + 1;\n}\n\n   asda    ');
        return Piler.utils.Promise.resolve();
      });

      manager
      .addFile(__dirname + '/fixtures/file.js').then(function(){
        return this.addMultiline(function(){/*   asda    */});
      }).then(function(){
        return this.contents();
      }).then(function(code){
        expect(code).to.eql([
          'function longName( argument1 ) {\n  return argument1 + 1;\n}\n\n   asda    '
        ]);
        Piler.utils.fs.writeFileAsync.restore();
        done();
      });
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
            .expect('content-type', new RegExp(self.manager.contentType))
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

        it('wrong id gives 404', function(done){
          var self = this;

          self.manager.addRaw('raw', {name: 'path'});

          supertest(self.app)
            .get('/piler/dev/global.raw-pathz.' + self.manager.type.prototype.ext)
            .expect(404)
            .end(function(err, res){
              expect(res.text).to.match(/Cannot find codeOb/);
              expect(self.spy.called).to.be(false); // falls to catch all
              done(err);
            });
        });

        it('volatile pile removes asset', function(done){
          var self = this;

          self.manager.addRaw('raw!', {name: 'path', namespace: 'n'});
          self.manager.piles.n.options.volatile = true;
          expect(self.manager.piles.n.assets).to.have.length(1);

          supertest(self.app)
            .get('/piler/temp/n.raw-path.' + self.manager.type.prototype.ext)
            .expect(200)
            .end(function(err, res){
              expect(self.manager.piles.n.assets).to.have.length(0);
              expect(res.text).to.match(/raw!/);
              expect(self.spy.called).to.be(false); // falls to catch all
              done(err);
            });
        });

        it('set cache-control for minified asset', function(done){
          var self = this;

          self.manager.addRaw('raw', {name: 'path', namespace: 'namespaced'});

          supertest(self.app)
            .get('/piler/min/cachekey/namespaced.' + self.manager.type.prototype.ext)
            .expect(200)
            .expect('content-type', new RegExp(self.manager.contentType))
            .expect('cache-control', /max\-age/)
            .end(function(err, res){
              expect(res.text).to.match(/namespaced\.raw\-path\./);
              done(err);
            });


        });

      });
    }

    for(i = 0; i < len; i++) {
      fn(types[i]);
    }
  });

  it('find assets by any member', function(done){
    var js = Piler.createManager('js');

    js.addRaw('function rawFn(){}', {name: 'rawFn'});

    js.findAssetBy('options.name', 'rawFn').then(function(ob){
      expect(ob).to.be.an('array');
      expect(ob[0].id()).to.be('rawFn');
      return js.findAssetBy('options.name','rawFn', 'nonglobal');
    }).catch(function(err){
      expect(err).to.match(/not found/);
    }).done(done);
  });

  it('stream contents', function(done){
    var
      js = Piler.createManager('js'),
      stream = Piler.utils.through(function(buffer, enc, callback){
        this.push(buffer);
        callback();
      }, function(){
        expect(this.read().toString()).to.match(/rawFn\(\)/);
        done();
      });

    js.addRaw('function rawFn(){}', {name: 'rawFn'});

    js.stream(['decaff']).pipe(stream);
  });

  it('applies default namespaces', function(){
    var
      prep = Piler.getManager('PileManager').prototype._prepareNamespaces,
      BasePile = Piler.getPile('BasePile');
    prep = prep.bind({
      piles: {
        global: new BasePile('global'),
        namespace: new BasePile('namespace'),
        temp: new BasePile('temp', {volatile: true})
      }
    });

    expect(prep()).to.eql(['global','temp']);
    expect(prep('namespace')).to.eql(['global','namespace','temp']);
    expect(prep('namespace', {disableGlobal: true})).to.eql(['namespace','temp']);
    expect(prep('namespace', {disableGlobal: true, disableVolatile: true})).to.eql(['namespace']);
    expect(prep(['namespace','space'], {disableGlobal: true, disableVolatile: true})).to.eql(['namespace','space']);
  });

  describe('built-in', function(){
    var types = ['js','css','html'], len = types.length, i, spy = sinon.spy();

    beforeEach(function(){
      sinon.stub(Piler.utils.fs, 'writeFileAsync', function(path, code){
        spy(code);
        return Piler.utils.Promise.resolve();
      });
    });

    afterEach(function(){
      Piler.utils.fs.writeFileAsync.restore();
    });

    function fn(type){
      beforeEach(function(){
        spy.reset();
      });

      var _path = Piler.utils.path.join(__dirname, '/ephemeral/', type);

      describe('using ' + type, function(){
        function createManager(options) {
          return Piler.createManager(type, options);
        }

        it('empty contents', function(done){
          var manager = createManager({outputDirectory: _path });

          manager.contents().then(function(code){
            if (type === 'js') {
              expect(spy.callCount).to.be(1);
              expect(code).to.have.length(1); // default addOb
            } else {
              expect(spy.callCount).to.be(0);
              expect(code).to.have.length(0);
            }
          }).done(done);
        });

        it('skip volatile', function(done){
          var manager = createManager({outputDirectory: _path });

          var name = manager.createTempNamespace();
          manager.addRaw('raw', {namespace: name});

          manager.contents().then(function(code){
            if (type === 'js') {
              expect(spy.callCount).to.be(1); // never output to directory
              expect(code).to.have.length(2); // default addOb
            } else {
              expect(spy.callCount).to.be(0); // never output to directory
              expect(code).to.have.length(1);
            }
          }).done(done);
        });

        describe('renders tags', function(){

          it('in development', function(done){
            var manager = createManager({env: 'development'});

            manager.addRaw('raw');
            manager.addMultiline(function(){/* "asdf" */});

            manager.render(['dummy']).then(function(code){
              expect(code).to.match(/global\.raw/);
              expect(code).to.match(/global\.multiline/);
            }).done(done);
          });

          it('in production', function(done){
            var manager = createManager({env: 'production'});

            manager.addRaw('raw');
            manager.addMultiline(function(){/* "asdf" */});

            manager.render(['dummy']).then(function(code){
              expect(code).to.match(/global\./);
            }).done(done);
          });

        });

        describe('getSources', function(){
          it('in development', function(){
            var manager = createManager({env: 'development', cacheKeys: false});

            var temp = manager.createTempNamespace();

            manager.addRaw('raw');
            manager.addUrl('/raw', {namespace: temp});
            manager.addMultiline(function(){/*asdf*/}, {namespace: temp});

            if (type === 'js') {
              expect(manager.getSources()).to.have.length(4);
            } else {
              expect(manager.getSources()).to.have.length(3);
            }
          });

          it('in production', function(done){
            var manager = createManager({env: 'production'});
            var temp = manager.createTempNamespace();

            Piler.wait([
              manager.addRaw('raw'),
              manager.addRaw('raw2'),
              manager.addUrl('/raw', {namespace: temp}),
              manager.addMultiline(function(){/*asdf*/}, {namespace: temp}),
            ]).done(function(){
              expect(manager.getSources()).to.have.length(3);
              done();
            });
          });

        });

        describe('addFiles and addWilcard', function(){
          var join = Piler.utils.path.join;

          it('addFiles', function(done){
            var manager = createManager();

            manager
            .addFiles([
              join(__dirname, 'fixtures', 'file.coffee'),
              join(__dirname, 'fixtures', 'file.es6.js')
            ]).then(function(result){
              expect(result).to.match(/global\.file-file_coffee/);
              expect(result).to.match(/global\.file-file_es6_js/);
            }).done(done);
          });

          it('addWilcard', function(done){
            var manager = createManager();

            manager
            .addWildcard([ join(__dirname, 'fixtures', 'file.*') ])
            .then(function(result){
              expect(result).to.match(/global\.file\-file/);
            })
            .done(done);
          });

        });
      });
    }

    for (i = 0; i < len; i++) {
      fn(types[i]);
    }

  });
});


