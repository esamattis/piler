#!/usr/bin/env bash

if [ "${TRAVIS}" ]; then
    sudo apt-get install libcairo2 libcairo2-dev
fi


(cd spec/testapp && coffee app.coffee) &
(cd spec/testapp && NODE_ENV=production coffee app.coffee) &

sleep 1

node_modules/.bin/jasmine-node --coffee spec/

trap "kill 0" SIGINT SIGTERM EXIT
