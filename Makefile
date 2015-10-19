# jspp flags
JSPP_FLAGS = -F istanbul --custom-filter "@module\b"
JSPP_RIOT_FLAGS = $(JSPP_FLAGS) -D RIOT
JSPP_NODE_FLAGS = $(JSPP_FLAGS) -D NODE --indent 2s

# Command line paths
ISTANBUL = ./node_modules/.bin/istanbul
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
JSPP = ./node_modules/jspreproc/bin/jspp.js

# folders
DIST = "./dist/"

test: build
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js -R spec

# riot-compiler is for inclusion in riot, it assume tmpl, brackets, and regEx are in the scope
build: eslint
	# rebuild all
	@ mkdir -p $(DIST)
	@ $(JSPP) $(JSPP_RIOT_FLAGS) lib/index.js > $(DIST)riot.compiler.js
	@ $(JSPP) $(JSPP_NODE_FLAGS) lib/index.js > $(DIST)compiler.js

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-coveralls: build
	@ RIOT_COV=1 cat ./coverage/lcov.info ./coverage/report-lcov/lcov.info | $(COVERALLS)

test-mocha:
	@ $(MOCHA) test/runner.js

debug: build
	@ node-debug $(MOCHA) test/runner.js

perf: build
	@ node --expose-gc test/perf.js

.PHONY: build test eslint test-coveralls debug perf
