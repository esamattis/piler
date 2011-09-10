
zombie = require "zombie"

servers =
  development: 7000
  production: 7001


for type, port of servers
  do (type, port) ->

    fetchPage = (path) ->
      ->
        jasmine.asyncSpecWait()
        @browser = new zombie.Browser()
        @browser.visit "http://localhost:#{ port }#{ path }", (err, browser) ->
          throw err if err
          jasmine.asyncSpecDone()

    describe "JS assets in #{ type } server", ->

      beforeEach fetchPage "/"

      it "Can share plain js files from fs", ->
        expect(@browser.window["js fs"]).toEqual true

      it "Coffee script files gets compiled transparently", ->
        expect(@browser.window["coffee fs"]).toEqual true

      it "addOb adds global variables", ->
        expect(@browser.window["addOb global"]).toEqual true

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


    describe "CSS assets in #{ type } server", ->

      beforeEach fetchPage "/"

      # TODO: how to test that css compiled correctly? Or the href attrs even point to something.
      it "We have css links", ->
        $ = @browser.window.jQuery
        expect($("link[rel='stylesheet']").size()).toBeGreaterThan 0


