
describe('misc', function(){

  it('make an array out of anything', function(){
    expect(Piler.utils.ensureArray(1)).to.eql([1]);
    expect(Piler.utils.ensureArray({})).to.eql([{}]);
    expect(Piler.utils.ensureArray(['a','b'])).to.eql(['a','b']);
    expect(Piler.utils.ensureArray()).to.eql([]);
  });

  it('extracts the extension', function(){
    expect(Piler.utils.extension('fi.le')).to.be('le');
    expect(Piler.utils.extension('multiple.dots.and.exts')).to.be('exts');
    expect(Piler.utils.extension('multiple/dots/and/exts.ext')).to.be('ext');
    expect(Piler.utils.extension()).to.be('');
  });

  it('Piler.require', function(){
    Piler.require(__dirname + '/fixtures/require.js');
    Piler.require(__dirname + '/fixtures/require.js', {});
  });

  it('Piler.use', function(){
    Piler.use(require(__dirname + '/fixtures/require.js'));
    Piler.use(require(__dirname + '/fixtures/require.js'), {});
  });

  it('Piler.all', function(done){
    var i = 0;
    var s = {
      render: function(){
        return Piler.utils.Promise.resolve((++i).toString());
      }
    };
    Piler.all([s, s, s], function(err, code){
      expect(err).to.be(null);
      expect(code).to.be('123');
      done();
    });
  });


});