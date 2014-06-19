'use strict';

var Compilers, c;

Compilers = require("../lib/compilers");
c = Compilers.compilers;

describe('built-in compilers', function(){

  it('must return unchanged plain css and js', function(done){
    c.js.render(null, 'asdf', function(err, code){
      expect(err).to.be(null);
      expect(code).to.be('asdf');

      c.css.render(null, 'dsa', function(err, code){
        expect(err).to.be(null);
        expect(code).to.be('dsa');
        done();
      });
    });
  });

  it('compiles coffee-script', function(done){
    c.coffee.render(null, '@', function(err, code) {
      expect(err).to.be(null);
      expect(code).to.be('(function() {\n  this;\n\n\n}).call(this);\n');
      c.coffee.render(null, '~', function(err){
        expect(err).to.be.ok();
        done();
      });
    });
  });

  describe('stylus', function(){
    it('compiles', function(done){
      c.styl.render('file.styl', 'body\n  color #000\n', function(err, code){
        expect(err).to.be(null);
        expect(code).to.be('body {\n  color: #000;\n}\n');
        done();
      });
    });

    it('uses nib', function(done){
      c.styl.render('file.styl', '@import "nib"\nbody\n  clearfix()', function(err, code){
        expect(err).to.be(null);
        expect(code).to.match(/:before/);
        done();
      });
    });
  });

  it('compiles less', function(done){
    c.less.render('file.less', '@base: #f938ab;\nbody { color: @base; } ', function(err, code){
      expect(err).to.be(null);
      expect(code).to.be('body {\n  color: #f938ab;\n}\n');
      done();
    });
  });

  describe('addCompiler', function(){

    it('can add custom compilers', function(done){
      Compilers.addCompiler('dummy', function(){
        function f(d){
          return 'dummy(' + d + ')';
        }
        return {
          render: function(filename, code, cb){
            cb(null, f(code));
          },
          targetExt: 'dummy'
        };
      });

      expect(c.dummy).to.be.ok();
      c.dummy.render('file.dummy', 'test', function(err, code){
        expect(err).to.be(null);
        expect(code).to.be('dummy(test)');
        Compilers.removeCompiler('dummy');
        done();
      });
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
