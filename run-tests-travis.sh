#!/usr/bin/env bash

(cd spec/testapp && coffee app.coffee) &
(cd spec/testapp && NODE_ENV=production coffee app.coffee) &

sleep 1

node_modules/.bin/jasmine-node --coffee spec/

echo "Also review the visual tests"
echo "    cd spec/testapp/"
echo "    coffee app.coffee"
echo "and open http://localhost:7000/"
