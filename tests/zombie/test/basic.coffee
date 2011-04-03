

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

    "test variable by res.share (object)": (privates, status) ->
      assert.isTrue privates.test_res_object_share

  'response at subpage':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url + "/subpage", (err, browser, status) =>
        @callback(browser.window._SC, status)

    "test variable by res.share does not exist": (privates, status) ->
      assert.isUndefined privates.test_res_basic_share

    "test variable by res.share (object) does not exist": (privates, status) ->
      assert.isUndefined privates.test_res_object_share


  'global variables in application root':
    topic: ->
      browser = new zombie.Browser debug: true
      browser.visit url, (err, browser, status) =>
        @callback(browser.window, status)

    "test no basic private in global": (window, status) ->
      assert.isUndefined window.basic_boolean

    "test global variabl set by server.exec": (window, status) ->
      assert.isTrue window.GLOBAL_VAR
      
    "test global variabl set by res.exec": (window, status) ->
      assert.isTrue window.GLOBAL_VAR_EXEC

    "test coffee clientscript": (window, status) ->
      assert.isTrue window.COFFEE_CLIENT_SCRIPT

    "test js clientscript": (window, status) ->
      assert.isTrue window.JS_CLIENT_SCRIPT


for path in [ "/", "/subpage"]

  batch["server.share and server.exec at #{ path }"] =

    topic: ->
      browser = new zombie.Browser debug: true
      console.log "####################"
      console.log url + path
      browser.visit (url + path), (err, browser, status) =>
        @callback(browser.window._SC, status)

    "test basic private": (privates, status) ->
      assert.isTrue privates.basic_boolean

    "test basic function": (privates, status) ->
      assert.isFunction privates.basic_function

    "test exec basic function": (privates, status) ->
      assert.isTrue privates.basic_function() == "cool"

    "test nested variables": (privates, status) ->
      assert.isTrue privates.nested.first.second_a == "a"



suite.addBatch batch
suite.export module
