'use strict';

var Minifiers = Piler.Minifiers;

describe('minify', function(){

  it('minifies css and js with built-in modules', function(done){
    Minifiers.minify('uglify', 'function f(longAssArgument){ return longAssArgument + 1; };').then(function(js){
      expect(js).to.be('function f(a){return a+1}');
      return Minifiers.minify('csso', 'body\n{\tcolor:#000;\n}');
    }).then(function(css){
      expect(css).to.be('body{color:#000}');
    }).done(done);
  });


});
