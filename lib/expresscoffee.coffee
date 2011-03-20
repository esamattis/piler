# expressjs
#
#

express = require 'express'

# hyrr...
exports.addSocketIO = addSocketIO = require("./addsocketio").addSocketIO
exports.addCodeSharing = addCodeSharing = require("./addcodesharing").addCodeSharing



exports.createServer = ->
  app = express.createServer()

  app.configure 'development', ->
    app.use express.errorHandler dumpExceptions: true, showStack: true

  app.configure 'production', ->
    app.use express.errorHandler()


  addCodeSharing addSocketIO app

