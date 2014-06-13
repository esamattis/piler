'use strict';

var incUrlSeq;

incUrlSeq = require("../lib/livecss").incUrlSeq;

describe('hrefupdater', function(){

  describe("incUrlSeq increases the id in the url", function (){
    var url;
    url = "/foo/bar.js?v=123";

    it("adds id in to url", function (){

      expect(incUrlSeq(url)).to.be(url.replace('.', '--1.'));
    });

    it("increases existing id", function (){
      var url2;
      url2 = incUrlSeq(url);

      expect(incUrlSeq(url2)).to.be(url.replace('.', '--2.'));
    });
  });

});
