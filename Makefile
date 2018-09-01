# Command line paths
ESLINT = ./node_modules/eslint/bin/eslint.js
MOCHA = ./node_modules/mocha/bin/_mocha
ROLLUP = ./node_modules/.bin/rollup
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

# folders
DIST = "./dist/"
SRC = "./src/"


build:
	@ mkdir -p $(DIST)
	@ $(ROLLUP) -c build/rollup.node.config.js
	@ $(ROLLUP) -c build/rollup.browser.config.js

clean:
	@ rm -rf $(DIST)

test:
	@ make build
	@ npx nyc $(MOCHA) -r reify test/*.specs.js

lint:
	@ $(ESLINT) src test

send-coverage:
	@ RIOT_COV=1 cat ./coverage/lcov.info | $(COVERALLS)
	ifeq ($(TESTCOVER),master 4.2)
		@ npm install codeclimate-test-reporter
		@ codeclimate-test-reporter < coverage/lcov.info
	endif

.PHONY: build clean test lint send-coverage