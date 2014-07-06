describe('serialize', function() {

  it('sha1', function() {
    expect(Piler.Serialize.sha1('abc').digest('hex')).to.be('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(Piler.Serialize.sha1('123', 'hex')).to.be('40bd001563085fc35165329ea1ff5c5ecbdbbeef');
    expect(Piler.Serialize.sha1().update('123').digest('hex')).to.be('40bd001563085fc35165329ea1ff5c5ecbdbbeef');
  });

  it('addSerializable', function() {
    var spy = sinon.stub();

    function f() {}
    spy.returns(f);
    Piler.Serialize.addSerializable('doh', spy);
    expect(spy.calledWith(Piler)).to.be(true);
    expect(Piler.Serialize.addSerializable('doh', spy)).to.be(f);
  });

  it('mixin code object', function() {
    var obj = {
      type: 'raw'
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj).to.have.keys(['type', 'options', 'id', 'raw', 'toString', 'contents']);
    expect(obj.id()).to.be('fe087b237e59');

    obj = {
      type: '123',
      options: {
        hashFrom: 'type'
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('40bd00156308');

    obj = {
      type: 'raw',
      options: {
        name: 'abc'
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('abc');

    obj = {
      type: 'raw',
      raw: 1,
      options: {
        hashFrom: 'raw'
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('356a192b7913');

    obj = {
      type: 'raw',
      raw: 1,
      options: {
        before: false,
        hashFrom: 'options.before'
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('7cb6efb98ba5');

    var
    path = Piler.utils.path.join(__dirname, 'fixtures', 'require.js'),
      hash = Piler.Serialize.sha1(path, 'hex');

    obj = {
      type: 'raw',
      raw: 1,
      options: {
        filePath: path,
        hashFrom: 'options.filePath'
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('require_js_' + hash.substr(0, 12));

    obj = {
      type: 'raw',
      raw: 1,
      options: {
        name: 'oops!',
        filePath: path
      }
    };
    Piler.Serialize.serialize.call(obj);
    expect(obj.id()).to.be('require_js_oops_');
  });

  it('throws', function() {
    var obj = {};

    Piler.Serialize.serialize.call(obj);
    expect(function() {
      Piler.Serialize.serialize.call(obj);
    }).to.throwException();
  });

  it('built-in serializables', function(done) {
    var obj;

    obj = {
      type: 'url',
      raw: 'http://example.com'
    };
    Piler.Serialize.serialize.call(obj);

    obj.contents().then(function(code){
      expect(code).to.be('http://example.com');
      obj = {
        type: 'raw',
        raw: 'as is'
      };
      Piler.Serialize.serialize.call(obj);
      return obj.contents();
    }).then(function(code){
      expect(code).to.be('as is');
      obj = {
        type: 'multiline',
        raw: function(){/*
          should retain whitespace
        */}
      };
      Piler.Serialize.serialize.call(obj);
      return obj.contents();
    }).then(function(code){
      expect(code).to.match(/should retain whitespace/);

      var path = Piler.utils.path.join(__dirname, 'fixtures', 'require.js');
      obj = {
        type: 'file',
        raw: path,
        options: {
          filePath: path
        }
      };
      Piler.Serialize.serialize.call(obj);
      return obj.contents();
    }).then(function(code){
      expect(code).to.match(/^module\.exports/);
    }).done(done);
  });

  it('deal with new serializables', function(done) {
    Piler.Serialize.addSerializable('lowercase', function() {
      return function(ob) {
        return ob.raw().toLowerCase();
      };
    });

    var obj = {
      type: 'lowercase',
      raw: 'UPPERCASE'
    };
    Piler.Serialize.serialize.call(obj);

    obj.contents().then(function(code) {
      expect(code).to.be('uppercase');
    }).done(done);
  });

  it('stringify', function() {
    expect(Piler.Serialize.stringify(1)).to.be('1');

    expect(Piler.Serialize.stringify('a')).to.be('"a"');

    expect(Piler.Serialize.stringify(1.1)).to.be('1.1');

    expect(Piler.Serialize.stringify([1, '1', {}])).to.be('[1,"1",{}]');

    expect(Piler.Serialize.stringify([{
      'a': {
        'b': [1, 'a']
      }
    }])).to.be('[{"a": {"b": [1,"a"]}}]');

    expect(Piler.Serialize.stringify([function(){ return 'a'; }])).to.be('[function (){ return \'a\'; }]');

    expect(Piler.Serialize.stringify({
      a: function(){ return 'a'; }
    })).to.be('{"a": function (){ return \'a\'; }}');
    expect(Piler.Serialize.stringify(false)).to.be('false');
  });
});