# Command line paths
KARMA = ./node_modules/karma/bin/karma
ISTANBUL = ./node_modules/karma-coverage/node_modules/.bin/istanbul
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

build:
	# build for the browser
	@ $(shell \
	  cat lib/browser/wrap/start.frag \
		lib/shared/index.js \
		lib/browser/parsers.js \
		lib/browser/core.js \
		lib/browser/wrap/end.frag > compiler-browser.js)
	# build for the server
	@ $(shell\
	  cat lib/server/wrap/start.frag \
	  lib/server/parsers.js \
	  lib/shared/index.js \
		lib/server/wrap/end.frag > index.js)

test: test-server

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-karma:
	@ $(KARMA) start test/karma.conf.js

test-server:
	$(ISTANBUL) cover $(MOCHA) -- test/server-runner.js -R spec

test-coveralls:
	@ RIOT_COV=1 cat ./coverage/lcov.info ./coverage/report-lcov/lcov.info | $(COVERALLS)


.PHONY: build test eslint test-karma test-coveralls
