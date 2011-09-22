#!/usr/bin/env bash



(cd spec/testapp && coffee app.coffee) &
(cd spec/testapp && NODE_ENV=production coffee app.coffee) &

sleep 1

node_modules/.bin/jasmine-node --coffee spec/

trap "kill 0" SIGINT SIGTERM EXIT
