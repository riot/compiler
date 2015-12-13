# jspreproc flags
#JSPP_DEBUG = -D DEBUG
JSPP_FLAGS = -F istanbul -F eslint --custom-filter "\s@(module|version)\b" --headers ""
JSPP_RIOT_FLAGS = $(JSPP_FLAGS) -D RIOT
JSPP_NODE_FLAGS = $(JSPP_FLAGS) -D NODE
JSPP_ES6_FLAGS  = $(JSPP_FLAGS)

# Code Climate only accepts the first job of default branch
TESTCOVER = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)

# Command line paths
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
ESLINT    = ./node_modules/eslint/bin/eslint.js
ISTANBUL  = ./node_modules/istanbul/lib/cli.js
MOCHA     = ./node_modules/mocha/bin/_mocha
JSPP      = ./node_modules/jspreproc/bin/jspp.js

# folders
DIST = "./dist/"

# default job
test: build test-mocha

build: eslint
	# rebuild all
	@ mkdir -p $(DIST)
	@ $(JSPP) $(JSPP_RIOT_FLAGS) lib/_riot.js > $(DIST)riot.compiler.js
	@ $(JSPP) $(JSPP_NODE_FLAGS) lib/_node.js > $(DIST)compiler.js
	@ $(JSPP) $(JSPP_ES6_FLAGS)  lib/_es6.js  > $(DIST)es6.compiler.js

eslint:
	# check code style
	@ $(ESLINT) -c ./.eslintrc lib

test-mocha:
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js

send-coverage:
	@ RIOT_COV=1 cat ./coverage/lcov.info | $(COVERALLS)
ifeq ($(TESTCOVER),master 4.2)
	@ npm install codeclimate-test-reporter
	@ codeclimate-test-reporter < coverage/lcov.info
else
	@ echo Send in master 4.2
endif

debug: build
	# launching node-inspector
	@ node-debug $(MOCHA) test/runner.js

perf: build
	@ node --expose-gc test/perf.js

.PHONY: test build eslint test-mocha send-coverage debug perf
