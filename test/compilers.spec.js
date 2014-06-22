'use strict';

var
  Compilers = Piler.Compilers, c = Compilers.compile;

describe('built-in compilers', function(){

  before(function(){
    Compilers.addCompiler('js', function(){
      return {
        execute: function(passthrough){
          return passthrough;
        },
        on: {}
      };
    });
    Compilers.addCompiler('css', function(){
      return {
        execute:function(passthrough){
          return passthrough;
        },
        on: {}
      };
    });
  });
  after(function(){
    Compilers.removeCompiler('css');
    Compilers.removeCompiler('js');
  });

  describe('compile', function(){
    it('throws when no compiler is found', function(){
      expect(function(){
        c('dont', '');
      }).to.throwException();
    });

    it('must return unchanged plain css and js', function(done){
      c('js', 'asdf').then(function(code){
        expect(code).to.be('asdf');
        return c('css', 'dsa');
      }).done(function(code){
        expect(code).to.be('dsa');
        done();
      });
    });

    it('has dual API', function(done){
      c('js','asdf', null, {}, function(err, code){
        expect(err).to.be(null);
        expect(code).to.be('asdf');
        done();
      });
    });

    it('compiles coffee-script', function(done){
      c('coffeescript', '@').then(function(code){
        expect(code).to.be('(function() {\n  this;\n\n\n}).call(this);\n');
        return c('coffee', '~');
      }).catch(function(err){
        expect(err).to.be.ok();
      }).done(done);
    });

    describe('stylus', function(){
      it('compiles', function(done){
        c('stylus', 'body\n  color #000\n', 'file.styl').then(function(code){
          expect(code).to.be('body {\n  color: #000;\n}\n');
        }).done(done);
      });

      it('uses nib', function(done){
        c('stylus', '@import "nib"\nbody\n  clearfix()','file.styl').then(function(code){
          expect(code).to.match(/:before/);
        }).done(done);
      });
    });

    it('compiles less', function(done){
      c('less', '@base: #f938ab;\nbody { color: @base; } ','file.less').then(function(code){
        expect(code).to.be('body {\n  color: #f938ab;\n}\n');
      }).done(done);
    });
  });

  describe('addCompiler', function(){

    it('can add custom compilers', function(done){
      var opts = {'lalala': true};

      Compilers.addCompiler('dummy', function(classes){
        expect(classes).to.be(Piler);

        function f(d){
          return 'dummy(' + d + ')';
        }
        return {
          execute: function(code, filename, options){
            expect(code).to.be('test');
            expect(filename).to.be('file.dummy');
            expect(options).to.be(opts);
            return f(code);
          },
          on: {},
          targetExt: 'dummy'
        };
      });

      c('dummy', 'test', 'file.dummy', opts).then(function(code){
        expect(code).to.be('dummy(test)');
        Compilers.removeCompiler('dummy');
      }).done(done);
    });

    it('throws', function(){
      expect(function(){
        Compilers.addCompiler('ext');
      }).to.throwException();

      expect(function(){
        Compilers.addCompiler('ext', function(){});
      }).to.throwException();
    });

  });

});
