'use strict';

var assetUrlParse;

assetUrlParse = require("../lib/asseturlparse");

describe('asseturlparser', function(){

  describe("parses url production url", function (){
    var url, urlOb, _i, _len, _ref;

    _ref = ["/pile/min/cachekey/my.js?v=43234", "/pile/min/my.js"];

    var testIt = function (){
      it("is minified", function (){

        expect(urlOb.min).to.be.ok();
      });

      it("name is my", function (){

        expect(urlOb.name).to.be("my");
      });

      it("has extension js", function (){

        expect(urlOb.ext).to.be("js");
      });
    };

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      url = _ref[_i];
      urlOb = assetUrlParse(url);

      testIt();
    }
  });

  describe("can find global", function (){
    var urlOb;
    urlOb = assetUrlParse("/pile/min/global.js?v=67cc16bec85749bfe34592397e4a31b0f47d4c59");

    it("has the default global", function (){
      expect(urlOb.min).to.be.ok();
      expect(urlOb.dev).to.not.be.ok();

      expect(urlOb.name).to.be("global");
    });

    it("has extension js", function (){

      expect(urlOb.ext).to.be("js");
    });

  });

  describe("parses url development url", function (){
    var url, urlOb, _i, _len, _ref;
    _ref = ["/pile/dev/my.exec-123.js?v=43234", "/pile/dev/my.exec-123.js"];

    var testIt = function (){
      it("name is my", function (){

        expect(urlOb.name).to.be("my");
      });

      it("is dev", function (){

        expect(urlOb.dev).to.be.ok();
      });

      it("has uid 123", function (){

        expect(urlOb.dev.uid).to.be("123");
      });

      it("has type exec", function (){

        expect(urlOb.dev.type).to.be("exec");
      });

      it("has ext js", function (){

        expect(urlOb.ext).to.be("js");
      });
    };

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      url = _ref[_i];
      urlOb = assetUrlParse(url);

      testIt();
    }
  });

  describe("parses css urls too", function (){
    var url, urlOb, _i, _len, _ref;
    _ref = ["/pile/dev/my.file-321.css?v=43234", "/pile/dev/my.file-321.css"];

    var testIt = function (){
      it("is css", function (){

        expect(urlOb.ext).to.be("css");
      });

      it("is dev", function (){

        expect(urlOb.dev).to.be.ok();
      });

      it("is has name my", function (){

        expect(urlOb.name).to.be("my");
      });
    };

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      url = _ref[_i];
      urlOb = assetUrlParse(url);

      testIt();
    }
  });

  describe("longer custom url root works too", function (){
    var urlOb;
    urlOb = assetUrlParse("/node-pile/pile/min/cachekey/global.js?v=67cc16bec85749bfe34592397e4a31b0f47d4c59");

    it("is min", function (){

      expect(urlOb.min).to.be.ok();
    });

    it("is not development", function (){

      expect(urlOb.dev).to.be.an('undefined');
    });

    it("it is the global pile", function (){

      expect(urlOb.name).to.be("global");
    });
  });

  describe("longer custom url root works too and in development", function (){
    var urlOb;
    urlOb = assetUrlParse("/node-pile/pile/dev/my.file-321.css?v=43234");

    it("is min", function (){

      expect(urlOb.min).to.be.an('undefined');
    });

    it("is not development", function (){

      expect(urlOb.dev).to.be.ok();
    });
    it("it is the global pile", function (){

      expect(urlOb.name).to.be("my");
    });

    it("has id 321", function (){

      expect(urlOb.dev.uid).to.be("321");
    });
  });

});

