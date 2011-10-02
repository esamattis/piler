
assetUrlParse = require "../lib/asseturlparse"

describe "parses url production url", ->
  for url in [  "/pile/min/my.js?v=43234", "/pile/min/my.js"]
    urlOb = assetUrlParse url

    it "is minified", ->
      expect(urlOb.min).toBeDefined()

    it "name is my", ->
      expect(urlOb.name).toBe "my"

    it "has extension js", ->
      expect(urlOb.ext).toBe "js"

describe "can find global", ->
  urlOb = assetUrlParse "/pile/min/global.js?v=67cc16bec85749bfe34592397e4a31b0f47d4c59"

  it "has the default global", ->

    expect(urlOb.min).toBeDefined()
    expect(urlOb.dev).toBeUndefined()
    expect(urlOb.name).toBe "global"

  it "has extension js", ->
    expect(urlOb.ext).toBe "js"



describe "parses url development url", ->
  for url in [  "/pile/dev/my.exec-123.js?v=43234", "/pile/dev/my.exec-123.js"]
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
  for url in [  "/pile/dev/my.file-321.css?v=43234", "/pile/dev/my.file-321.css"]
    urlOb = assetUrlParse url

    it "is css", ->
      expect(urlOb.ext).toBe "css"

    it "is dev", ->
      expect(urlOb.dev).toBeDefined()

    it "is has name my", ->
      expect(urlOb.name).toBe "my"


describe "longer custom url root works too", ->
  urlOb = assetUrlParse "/node-pile/pile/min/global.js?v=67cc16bec85749bfe34592397e4a31b0f47d4c59"

  it "is min", ->
    expect(urlOb.min).toBeDefined()

  it "is not development", ->
    expect(urlOb.dev).toBeUndefined()

  it "it is the global pile", ->
    expect(urlOb.name).toBe "global"


describe "longer custom url root works too and in development", ->
  urlOb = assetUrlParse "/node-pile/pile/dev/my.file-321.css?v=43234"

  it "is min", ->
    expect(urlOb.min).toBeUndefined()

  it "is not development", ->
    expect(urlOb.dev).toBeDefined()

  it "it is the global pile", ->
    expect(urlOb.name).toBe "my"

  it "has id 321", ->
    expect(urlOb.dev.uid).toBe "321"

