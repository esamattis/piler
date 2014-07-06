'use strict';

var
Processors = Piler.Processors,
  c = Processors.process;

describe('processors', function() {

  beforeEach(function() {
    Processors.addProcessor('js', function() {
      return {
        post: {
          render: function(passthrough) {
            return passthrough;
          }
        }
      };
    });
    Processors.addProcessor('css', function() {
      return {
        post: {
          render: function(passthrough) {
            return passthrough;
          }
        }
      };
    });
  });

  afterEach(function() {
    Processors.removeProcessor('css');
    Processors.removeProcessor('js');
  });

  describe('built-in preprocessors', function() {

    describe('compiling', function() {
      it('throws when no processor is found', function() {
        expect(function() {
          c('dont');
        }).to.throwException();

        expect(function() {
          c('css', '');
        }).to.throwException();
      });

      it('must return unchanged plain css and js', function(done) {
        c('js', 'asdf').then(function(code) {
          expect(code).to.be('asdf');
          return c('css', 'dsa');
        }).done(function(code) {
          expect(code).to.be('dsa');
          done();
        });
      });

      it('has dual API', function(done) {
        c('js', 'asdf', {}, {}, [], function(err, code) {
          expect(err).to.be(null);
          expect(code).to.be('asdf');
          done();
        });
      });

      describe('coffee-script', function(){
        it('compiles', function(done) {
          c('coffeescript', '@').then(function(code) {
            expect(code).to.be('(function() {\n  this;\n\n\n}).call(this);\n');

            var asset = Piler.Serialize.serialize.call({
              type: 'file',
              raw: __dirname + '/fixtures/file.coffee',
              options: {
                filePath: __dirname + '/fixtures/file.coffee'
              }
            });

            return c('coffeescript', null, asset, {bare: true});
          }).then(function(code){
            expect(code).to.be('this;\n\n');
            return c('coffeescript', '~');
          }).catch(function(err){
            expect(err.message).to.match(/unexpected/);
          }).done(done, function(err){
            expect(err).to.be.ok();
            done(err);
          });
        });
      });

      describe('stylus', function() {
        it('compiles', function(done) {
          c('stylus', 'body\n  color #000\n').then(function(code) {
            expect(code).to.be('body {\n  color: #000;\n}\n');
            var asset = Piler.Serialize.serialize.call({
              type: 'file',
              raw: __dirname + '/fixtures/file.styl',
              options: {
                filePath: __dirname + '/fixtures/file.styl'
              }
            });
            return c('stylus', null, asset);
          }).then(function(code){
            expect(code).to.be('body {\n  color: #000;\n}\n');
          }).done(done);
        });

        it('uses nib', function(done) {
          c('stylus', '@import "nib"\nbody\n  clearfix()').then(function(code) {
            expect(code).to.match(/:before/);
            return c('stylus', '@import');
          }).catch(function(err){
            expect(err).to.match(/@import/);
            return true;
          }).then(function(s){
            expect(s).to.be(true);
          }).done(done);
        });
      });

      describe('less', function(){
        it('compiles', function(done) {
          c('less', '@base: #f938ab;\nbody { color: @base; } ').then(function(code) {
            expect(code).to.be('body {\n  color: #f938ab;\n}\n');
          })
          .then(function(){
            var asset = Piler.Serialize.serialize.call({
              type: 'file',
              raw: __dirname + '/fixtures/file.less',
              options: {
                filePath: __dirname + '/fixtures/file.less'
              }
            });
            return c('less', null, asset);
          })
          .then(function(code){
            expect(code).to.be('body {\n  color: #f938ab;\n}\n');
          })
          .done(done);
        });
      });

      describe('es6', function(){
        it('compiles', function(done){
          c('es6', 'export class A { }').then(function(code){
            expect(code).to.match(/traceur/);
            var asset = Piler.Serialize.serialize.call({
              type: 'file',
              raw: __dirname + '/fixtures/file.es6.js',
              options: {
                filePath: __dirname + '/fixtures/file.es6.js'
              }
            });
            return c('es6', null, asset);
          }).then(function(code){
            expect(code).to.match(/traceur/);
          }).done(done);
        });
      });
    });

  });

  describe('minifying', function() {

    it('css', function(done) {
      c('csso', 'a {\n\tcolor: #ff0000;\n}').then(function(code) {
        expect(code).to.be('a{color:red}');
        var asset = Piler.Serialize.serialize.call({
          type: 'file',
          raw: __dirname + '/fixtures/file.css',
          options: {
            filePath: __dirname + '/fixtures/file.css',
            env: 'production'
          }
        });
        return c('csso', null , asset);
      }).then(function(code){
        expect(code).to.be('a{color:red}');
      }).done(done);
    });

    it('javascript', function(done) {
      c('uglify', 'function longName( argument1 ){ return argument1 + 1;  }', null, {
        manglenames: true
      }).then(function(code) {
        expect(code).to.be('function longName(n){return n+1}');
        var asset = Piler.Serialize.serialize.call({
          type: 'file',
          raw: __dirname + '/fixtures/file.js',
          options: {
            filePath: __dirname + '/fixtures/file.js',
            env: 'production'
          }
        });
        return c('uglify', null, asset);
      }).then(function(code){
        expect(code).to.be('function longName(n){return n+1}');
        return c('uglify', 'function longName( argument1 ){ return argument1 + 1;  }', null, {mangle: false});
      }).then(function(code){
        expect(code).to.be('function longName(argument1){return argument1+1}');
      }).done(function(){
        done();
      }, function(err){
        if (!(err instanceof Error)) {
          throw new Error(err);
        } else {
          throw err;
        }
      });
    });

  });

  describe('addProcessor', function() {

    it('can add custom compilers', function(done) {
      Processors.addProcessor('dummy', function(classes) {
        expect(classes).to.be(Piler);

        function f(d) {
          return 'dummy(' + d + ')';
        }

        return {
          post: {
            render: function(code, asset, options) {
              expect(code).to.be('1 + test');
              expect(options).to.eql({
                lalala: true
              });
              return f(code);
            },
            defaults: {
              'lalala': false
            }
          },
          pre: {
            render: function(code, asset, options) {
              expect(options).to.eql({
                lalala: true,
                lololo: true
              });
              expect(code).to.be('test');
              return '1 + ' + code;
            },
            defaults: {
              'lololo': true
            }
          }
        };
      });

      c('dummy', 'test', {}, {
        'lalala': true
      }, []).then(function(code) {
        expect(code).to.be('dummy(1 + test)');
        Processors.removeProcessor('dummy');
      }).done(done);
    });

    it('mix existing processors', function(done) {
      Processors.addProcessor('ejs-coffee', function(classes) {
        expect(classes).to.be(Piler);

        var ejs = require('ejs');

        return {
          post: {
            render: function(code, asset, options) {
              return classes.Processors.process('coffeescript', code, asset, options, 'pre')
                .then(function(code) {
                  // uglify is picky
                  delete options.bare;
                  delete options.locals;

                  return classes.Processors.process('uglify', code, asset, options, 'post');
                }, function(err){
                  return err;
                });
            },
            defaults: {
              bare: true
            }
          },
          pre: {
            render: function(code, asset, options) {
              asset.options.processors.coffeescript = {};
              asset.options.processors.uglify = {};

              return ejs.render(code, {
                locals: options.locals
              });
            }
          }
        };
      });

      c('ejs-coffee', 'aasda = -> console.log "<%= whoa %>"\naasda()', null, {
        locals: {
          whoa: 'ejs rocks'
        }
      }).then(function(code) {
        expect(code).to.be('var aasda;(aasda=function(){return console.log("ejs rocks")})();');
      }).done(function(code){
        Processors.removeProcessor('ejs-coffee');
        done();
      });
    });

    describe('condition', function(){

      it('executes processor conditionally', function(done) {
        var asset = Piler.Serialize.serialize.call({
          type: 'raw',
          raw: '// test me',
          options: {
            filePath: './testing.test.js'
          }
        });

        Processors.addProcessor('test', function() {
          return {
            pre: {
              render: function(code, asset, options) {
                return 'testing = ' + code;
              },
              condition: function(asset) {
                return asset.options.filePath.indexOf('.test') > -1 || asset.raw().indexOf('// test me') > -1;
              }
            },
            post: {
              render: function(code, asset, options) {
                expect(options).to.eql({asdf:true});

                return 'tested = ' + code;
              },
              condition: function(asset, options) {
                var opts = Piler.utils.objectPath.get(asset.options, 'processors.test');
                if (opts) {
                  Piler.utils._.merge(options, opts);
                  return true;
                }
                return false;
              }
            }
          };
        });

        c('test', null, asset).then(function(code) {
          expect(code).to.be('testing = // test me');
          asset.options.processors.test = {asdf:true};
          return c('test', 'test', asset);
        }).then(function(code) {
          expect(code).to.be('tested = testing = test');
        }).finally(function() {
          done();
        });
      });

      it('can bypass condition with force', function(done){
        Processors.addProcessor('test', function(){
          return {
            pre: {
              render: function(code, asset, options){
                return '(' + code + ')';
              },
              condition: function(asset, options){
                return asset.options && asset.options.filePath === 'never will';
              }
            }
          };
        });

        var asset = Piler.Serialize.serialize.call({
          type: 'raw',
          raw: 'testme'
        });

        c('test', 'testme', asset).then(function(code){
          expect(code).to.be('testme');
          return c('test', 'testme', asset, {force: true});
        }).then(function(code){
          expect(code).to.be('(testme)');
        }).done(done);
      });

      it('rethrows condition exceptions', function(done){
        Processors.addProcessor('test', function(){
          return {
            pre: {
              render: function(code, asset, options){
                return '(' + code + ')';
              },
              condition: function(asset, options){
                return asset.option.filePath === 'never will'; // typo
              }
            }
          };
        });
        var asset = Piler.Serialize.serialize.call({
          type: 'raw',
          raw: 'testme'
        });

        c('test', null, asset).catch(function(err){
          expect(err).to.match(/'filePath'/);
          done();
        });
      });

    });

    it('fills default options', function(){
      var processor = Processors.addProcessor('asdf', function(){
        return {
          pre: {
            render: function(){}
          },
          post: {
            render: function(){}
          }
        };
      });

      expect(processor.pre.condition).to.be.ok();
      expect(processor.post.condition).to.be.ok();
    });

    it('throws', function() {
      expect(function() {
        Processors.addProcessor();
      }).to.throwException();

      expect(function() {
        Processors.addProcessor('ext');
      }).to.throwException();

      expect(function() {
        Processors.addProcessor('ext', function() {});
      }).to.throwException();
    });

    it('getProcessor', function(){
      expect(Piler.utils._.isObject(Processors.getProcessor('js'))).to.be(true);
    });

  });

});