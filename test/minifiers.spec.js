'use strict';

var Minify, m;

Minify = require("../lib/minify");

describe('minify', function(){

  it('minifies css and js with built-in modules', function(){
    expect(Minify.minify('js', 'function f(longAssArgument){ return longAssArgument + 1; };')).to.be('function f(a){return a+1}');
    expect(Minify.minify('css', 'body\n{\tcolor:#000;\n}')).to.be('body{color:#000}');
  });


});
