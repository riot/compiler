# Command line paths
ISTANBUL = ./node_modules/.bin/istanbul
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

build:
	@ $(shell \
	  cat lib/wrap/start.frag \
	  lib/parsers.js \
		lib/core.js \
		lib/browser.js \
		lib/wrap/end.frag > index.js)

test:
	@ make eslint
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js -R spec

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-coveralls:
	@ RIOT_COV=1 cat ./coverage/lcov.info ./coverage/report-lcov/lcov.info | $(COVERALLS)

.PHONY: build test eslint test-karma test-coveralls
