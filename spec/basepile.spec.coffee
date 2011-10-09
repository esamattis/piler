
{JSPile, CSSPile, JSManager, CSSManager} = require "../lib/piler"

for Pile in [JSPile, CSSPile] then do (Pile) ->

  describe "addFile works as expected in #{ Pile.name }", ->
    dummyPath = "/foo/bar"

    it "Pile addFile adds up to one file", ->
      js = new Pile
      js.addFile dummyPath
      expect(js.code.length).toBe 1

    it "Pile addFile cannot make duplicates", ->
      js = new Pile
      js.addFile dummyPath
      js.addFile dummyPath
      expect(js.code.length).toBe 1


  describe "addUrl works as expected in #{ Pile.name }", ->
    dummyUrl = "http://example.com/test.js"

    it "Pile addUrl adds up to one url", ->
      js = new Pile
      js.addUrl dummyUrl
      expect(js.urls.length).toBe 1

    it "Pile addUrl cannot make duplicates", ->
      js = new Pile
      js.addUrl dummyUrl
      js.addUrl dummyUrl
      expect(js.urls.length).toBe 1
