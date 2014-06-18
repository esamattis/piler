'use strict';

var Compilers;

Compilers = require("../lib/compilers");

describe('built-in compilers', function(){

  it('must return unchanged plain css and js', function(done){
    Compilers.js.render(null, 'asdf', function(err, code){
      expect(err).to.be(null);
      expect(code).to.be('asdf');

      Compilers.css.render(null, 'dsa', function(err, code){
        expect(err).to.be(null);
        expect(code).to.be('dsa');
        done();
      });
    });
  });

  it('compiles coffee-script', function(done){
    Compilers.coffee.render(null, '@', function(err, code) {
      expect(err).to.be(null);
      expect(code).to.be('(function() {\n  this;\n\n\n}).call(this);\n');
      Compilers.coffee.render(null, '~', function(err){
        expect(err).to.be.ok();
        done();
      });
    });
  });

});
