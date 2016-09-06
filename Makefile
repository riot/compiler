# jspreproc flags
JSPP_FLAGS = -F istanbul -F eslint --custom-filter "\s@(module|version)\b" --headers ""
JSPP_NODE_FLAGS = $(JSPP_FLAGS) -D NODE -F jsdoc
JSPP_RIOT_FLAGS = $(JSPP_FLAGS)
JSPP_ES6_FLAGS  = $(JSPP_FLAGS)

# Code Climate only accepts the first job of default branch
TESTCOVER = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)
NODE_VER := $(shell node nodever)

# Command line paths
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
ESLINT    = ./node_modules/eslint/bin/eslint.js
ISTANBUL  = ./node_modules/istanbul/lib/cli.js
MOCHA     = ./node_modules/mocha/bin/_mocha
JSPP      = ./node_modules/jspreproc/bin/jspp.js

# folders
DIST = "./dist/"
LIB = "./lib/"

# default job
test: build test-mocha

build: clean eslint pre-build
	# build riot and es6 versions
	@ $(JSPP) $(JSPP_RIOT_FLAGS) src/_riot.js > $(DIST)riot.compiler.js
	@ $(JSPP) $(JSPP_ES6_FLAGS)  src/_es6.js  > $(DIST)es6.compiler.js

clean:
	@ rm -rf $(DIST)

pre-build:
	# build the node version
	@ mkdir -p $(DIST)
	@ $(JSPP) $(JSPP_NODE_FLAGS) src/core.js > $(LIB)compiler.js
	@ $(JSPP) $(JSPP_NODE_FLAGS) src/safe-regex.js > $(LIB)safe-regex.js

showenv:
	@echo "$(NODE_VER)"

eslint:
	# check code style
ifneq ($(NODE_VER),0.12)
	@ $(ESLINT) -c ./.eslintrc.yml src test
	@ $(ESLINT) -c ./.eslintrc.yml lib \
    --ignore-pattern "**/compiler.js" --ignore-pattern "**/safe-regex.js"
endif

test-mocha:
	@ $(ISTANBUL) cover $(MOCHA) -- test/runner.js

send-coverage:
	@ RIOT_COV=1 cat ./coverage/lcov.info | $(COVERALLS)
ifeq ($(TESTCOVER),master 4.2)
	@ npm install codeclimate-test-reporter
	@ codeclimate-test-reporter < coverage/lcov.info
endif

debug: build
	# launching node-inspector
	@ node-debug $(MOCHA) test/runner.js

perf: build
	@ node --expose-gc test/perf.js

docs: build
	@ jsdoc $(LIB) --configure ./jsdoc.json -P ./package.json --verbose

.PHONY: test pre-build build eslint test-mocha send-coverage debug perf docs
