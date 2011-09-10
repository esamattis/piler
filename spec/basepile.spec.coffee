
{JSPile, CSSPile} = require "../lib/piles"

for Pile in [JSPile, CSSPile] then do (Pile) ->


  describe "addFile works as expected", ->
    dummyPath = "/foo/bar"

    it "Pile addFile cannot make duplicates #{ Pile::urlRoot }", ->
      js = new Pile
      js.addFile dummyPath
      expect(js.files.length).toBe 1

    it "Pile addFile cannot make duplicates #{ Pile::urlRoot }", ->
      js = new Pile
      js.addFile dummyPath
      js.addFile dummyPath
      expect(js.files.length).toBe 1


  describe "addUrl works as expected", ->
    dummyUrl = "http://example.com/test.js"

    it "Pile addUrl cannot make duplicates #{ Pile::urlRoot }", ->
      js = new Pile
      js.addUrl dummyUrl
      expect(js.urls.length).toBe 1

    it "Pile addUrl cannot make duplicates #{ Pile::urlRoot }", ->
      js = new Pile
      js.addUrl dummyUrl
      js.addUrl dummyUrl
      expect(js.urls.length).toBe 1
