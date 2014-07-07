'use strict';

var LiveCSS = Piler.LiveCSS, CSSManager, JSManager;

describe('livecss', function (){

  beforeEach(function (){
    CSSManager = Piler.createManager('css');
    JSManager = Piler.createManager('js');
  });

  afterEach(function (){
    CSSManager.dispose('global');
    JSManager.dispose('global');
    CSSManager = null;
    JSManager = null;
  });

  it('throws on missing parameters', function (){
    expect(function (){
      LiveCSS.init();
    }).to.throwError();
  });

  it('dont enable on production', function (){
    sinon.stub(JSManager.options.logger, 'info');
    JSManager.options.env = 'production';
    LiveCSS.init(JSManager, 'dummy', 'dummy');

    expect(JSManager.options.logger.info.calledWith('Not activating live update in production')).to.be(true);
    JSManager.options.logger.info.restore();
  });

  it('creates internal socket io', function(){
    sinon.stub(JSManager.options.logger, 'info');

    var
      server = require('http').createServer();

    sinon.stub(server, 'listen', function(){});
    sinon.stub(server, 'listeners', function(){ return []; });

    var io = LiveCSS.init(JSManager, CSSManager, server);

    JSManager.options.logger.info.restore();

    expect(io.name).to.be('/pile');
    expect(server.listeners.calledWith('request')).to.be(true);
  });

  it('watch files on the CSSmanager piles', function (done){
    var io = require('socket.io')();

    sinon.stub(JSManager.options.logger, 'info');
    sinon.stub(Piler.utils.fs, 'readFileAsync', function(){
      return Piler.utils.Promise.resolve('');
    });

    var calls = 2;

    sinon.stub(Piler.utils.fs, 'watch', function(file){
      if (calls === 2) {
        expect(file).to.be('test.css');
      } else if (calls === 1) {
        expect(file).to.be('test2.css');
      }

      if (--calls === 0) {
        expect(JSManager.piles.global.assets.length).to.be.above(3);

        for (var i = 0, len = JSManager.piles.global.assets.length; i < len; i++) {
          var k = JSManager.piles.global.assets[i];
          switch (k.type()){
            case 'url':
              expect(k.raw()).to.be('/socket.io/socket.io.js');
              break;
            case 'obj':
              expect(k.raw()).to.eql({
                'piler.livecss': {
                  incUrlSeq: Piler.LiveCSS.incUrlSeq
                }
              });
              break;
            case 'exec':
              expect(k.raw()).to.match(/io\.connect('\/pile');/);
              break;
          }
        }


        expect(io.of.calledWith('/pile')).to.be(true);

        io.of.restore();
        JSManager.options.logger.info.restore();
        Piler.utils.fs.watch.restore();
        Piler.utils.fs.readFileAsync.restore();

        done();
      }
    });

    CSSManager.batch([
      ['addFile','test.css'],
      ['addRaw','a { color: red; }'],
      ['addFile','test2.css', {namespace:'dummy'}]
    ]);

    sinon.spy(io, 'of');

    LiveCSS.init(JSManager, CSSManager, 'dummy', io);
  });

});
