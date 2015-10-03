# jspp flags
#JSPP_FLAGS = "-D DEBUG"
JSPP_FLAGS =

# Command line paths
ISTANBUL = ./node_modules/.bin/istanbul
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
JSPP = ./node_modules/.bin/jspp $(JSPP_FLAGS)

# folders
DIST = "./dist/"

test: build
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js -R spec

# riot-compiler is for inclusion in riot, it assume tmpl, brackets, and regEx are in the scope
build: eslint
	# rebuild all
	@ $(JSPP) lib/index.js > $(DIST)riot.compiler.js
	@ $(JSPP) lib/index.js -D RIOT_CLI > $(DIST)compiler.js

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-coveralls:
	@ RIOT_COV=1 cat ./coverage/lcov.info ./coverage/report-lcov/lcov.info | $(COVERALLS)

test-mocha:
	@ $(MOCHA) test/runner.js

debug: build
	@ node-debug $(MOCHA) test/runner.js

perf: build
	@ node test/perf.js

.PHONY: build test eslint test-coveralls debug perf
