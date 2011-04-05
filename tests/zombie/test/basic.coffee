

vows = require "vows"
assert = require "assert"
zombie = require "zombie"

url = "http://localhost:1234"

suite = vows.describe 'zombie suite'

batch =

  'response at root':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url, (err, browser, status) =>
        @callback(browser.window._SC, status)

    "test variable by res.share": (privates, status) ->
      assert.isTrue privates.test_res_basic_share


  'response at subpage':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url + "/subpage", (err, browser, status) =>
        @callback(browser.window, status)

    "test variable by res.share does not exist": (window, status) ->
      assert.isUndefined window._SC.test_res_basic_share

    "test variable by res.share (object) does not exist": (window, status) ->
      assert.isUndefined window._SC.test_res_object_share

    "subpage res.share works": (window, status) ->
      assert.isTrue window._SC.sub_page_res


    "ns share": (window, status) ->
      assert.strictEqual window._SC.ns_shared_on_subpage, true

    "ns exec": (window, status) ->
      assert.strictEqual window.NS_EXEC_ON_SUBPAGE, true


  'no reponse.share here':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url + "/noresshare", (err, browser, status) =>
        @callback(browser.window._SC, status)

    "just works": (privates, status) ->
      assert.isTrue privates.basic_boolean



  'global variables in application root':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url, (err, browser, status) =>
        @callback(browser.window, status)

    "no basic private in window": (window, status) ->
      assert.isUndefined window.basic_boolean


    "no global variable set by res.exec": (window, status) ->
      assert.isTrue window.GLOBAL_RES_EXEC


    "ns exec not here": (window, status) ->
      assert.isUndefined window.NS_EXEC_ON_SUBPAGE

    "ns share not here": (window, status) ->
      assert.isUndefined window.ns_shared_on_subpage


for path in [ "/", "/subpage"]

  batch["server.share and server.exec at #{ path }"] =

    topic: ->
      browser = new zombie.Browser debug: true
      console.log "####################"
      console.log url + path
      browser.visit (url + path), (err, browser, status) =>
        @callback(browser.window, status)

    "test basic private": (window, status) ->
      assert.isTrue window._SC.basic_boolean

    "test basic function": (window, status) ->
      assert.isFunction window._SC.basic_function

    "test exec basic function": (window, status) ->
      assert.isTrue window._SC.basic_function() == "cool"

    "test nested variables": (window, status) ->
      assert.isTrue window._SC.nested.first.second_a == "a"

    "test global variabl set by server.exec": (window, status) ->
      assert.isTrue window.GLOBAL_VAR

    "test js clientscript": (window, status) ->
      assert.isTrue window.JS_CLIENT_SCRIPT

    "test coffee clientscript": (window, status) ->
      assert.isTrue window.COFFEE_CLIENT_SCRIPT

suite.addBatch batch
suite.export module
