
assetUrlParse = require "../lib/asseturlparse"

describe "parses url production url", ->
  for url in [  "/pile/my.min.js?v=43234", "/pile/my.min.js"]
    urlOb = assetUrlParse url

    it "is minified", ->
      expect(urlOb.min).toBeDefined()

    it "name is my", ->
      expect(urlOb.name).toBe "my"


describe "parses url development url", ->
  for url in [  "/pile/my.dev-exec-123.js?v=43234", "/pile/my.dev-exec-123.js"]
    urlOb = assetUrlParse url

    it "name is my", ->
      expect(urlOb.name).toBe "my"

    it "is dev", ->
      expect(urlOb.dev).toBeDefined()

    it "has uid 123", ->
      expect(urlOb.dev.uid).toBe "123"

    it "has type exec", ->
      expect(urlOb.dev.type).toBe "exec"

    it "has ext js", ->
      expect(urlOb.ext).toBe "js"


describe "parses css urls too", ->
  for url in [  "/pile/my.dev-file-321.css?v=43234", "/pile/my.dev-file-321.css"]
    urlOb = assetUrlParse url

    it "is css", ->
      expect(urlOb.ext).toBe "css"

    it "is dev", ->
      expect(urlOb.dev).toBeDefined()

    it "is has name my", ->
      expect(urlOb.name).toBe "my"



