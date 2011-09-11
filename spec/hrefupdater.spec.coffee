
{incUrlSeq} = require "../lib/livecss"


describe "incUrlSeq increases the id in the url", ->
  url =  "/foo/bar.js?v=123"

  it "adds id in to url", ->
    expect(incUrlSeq url).toBe url + "--1"

  it "increases existing id", ->
    url2 = incUrlSeq url
    expect(incUrlSeq url2).toBe url + "--2"
