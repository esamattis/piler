
express = require 'express'

# hyrr...
exports.addSocketIO = addSocketIO = require("./addsocketio").addSocketIO
exports.addCodeSharingTo = addCodeSharingTo = require("./addcodesharing").addCodeSharingTo



exports.createServer = ->
  app = express.createServer()
  
  debugger
  
  

  app.configure 'development', ->
    app.use express.errorHandler dumpExceptions: true, showStack: true

  app.configure 'production', ->
    app.use express.errorHandler()


  addCodeSharingTo addSocketIO app

