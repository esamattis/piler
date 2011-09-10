util = require "util"

async = require "async"
request = require "request"
zombie = require "zombie"

{CSSLint} = require "csslint"

rules = CSSLint.getRules().filter (rule) -> rule.id is "errors"
CSSLint.clearRules()
CSSLint.addRule r for r in rules

validateCSS = CSSLint.verify

servers =
  development: 7000
  production: 7001


for type, port of servers then do (type, port) ->

  fetchPage = (path) -> ->
    jasmine.asyncSpecWait()
    @browser = new zombie.Browser()
    @httpRoot = "http://localhost:#{ port }"
    @browser.visit @httpRoot + path, (err, browser) ->
      throw err if err
      jasmine.asyncSpecDone()

  describe "JS assets in #{ type } server", ->

    beforeEach fetchPage "/"

    it "Can share plain js files from fs", ->
      expect(@browser.window["js fs"]).toEqual true

    it "Coffee script files get compiled transparently", ->
      expect(@browser.window["coffee fs"]).toEqual true

    it "addOb adds global variables", ->
      expect(@browser.window["addOb global"]).toEqual true

    it "js.addExec gets executed", ->
      expect(@browser.window["js exec"]).toEqual true

    it "res.exec gets executed", ->
      expect(@browser.window["response exec"]).toEqual true

    it "addUrl can load assets from remote servers", ->
      expect(@browser.window["remote script"]).toEqual true

    it "No namespaced js here", ->
      expect(@browser.window["namespace"]).toBeUndefined()


  describe "Namespaced JS assets in #{ type } server", ->

    beforeEach fetchPage "/namespace"

    it "We have namaspaced js here", ->
      expect(@browser.window["namespace"]).toEqual true

    it "We have also global js", ->
      expect(@browser.window["js fs"]).toEqual true

    it "namespaced js.addExec gets executed", ->
      expect(@browser.window["namespace js exec"]).toEqual true

  describe "CSS assets in #{ type } server", ->

    beforeEach fetchPage "/"

    it "We have css links", ->
      $ = @browser.window.jQuery
      expect($("link[rel='stylesheet']").size()).toBeGreaterThan 0

    it "We have valid CSS", ->
      $ = @browser.window.jQuery

      cssUrls = $("link[rel='stylesheet']").map -> this.href

      jasmine.asyncSpecWait()

      async.reduce cssUrls, "", (memo, path, cb) =>
        request @httpRoot + path, (err, res, body) ->
          return cb err if err
          cb null, memo + body
      , (err, css) ->
        throw err if err

        # Just use csslint to validate that we have sane css here until we come
        # up with something better. This will at least confirm that
        # preprocessors work.
        result = validateCSS css
        expect(result.messages.length).toBe 0, "#{ util.inspect result.messages }"
        jasmine.asyncSpecDone()







