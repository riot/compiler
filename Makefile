# Command line paths
ISTANBUL = ./node_modules/.bin/istanbul
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
RMCOMMS = ./node_modules/rmcomms/bin/rmcomms-cli.js

build:
	@ $(shell cat \
	  lib/wrap/start.frag \
	  lib/parsers.js \
	  lib/regexps.js \
	  lib/brackets.js \
	  lib/tmpl.js \
		lib/core.js \
		lib/wrap/end.frag > dist/compiler.js)

test: build eslint
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js -R spec

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-coveralls:
	@ RIOT_COV=1 cat ./coverage/lcov.info ./coverage/report-lcov/lcov.info | $(COVERALLS)

debug: build
	@ node-debug $(MOCHA) -d test/runner.js

perf: build
	@ node test/perf.js

.PHONY: build test eslint test-karma test-coveralls perf
