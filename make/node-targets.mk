#
# Makefile to define some node project make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

NODE_SPECS ?= spec
NODE_COVERAGE_DIR ?= .coverage
JASMINE_NODE_OPTS ?= --captureExceptions --verbose
NODE_COVERAGE_OPTS ?= -x **/spec/** --report cobertura --report lcov --dir $(NODE_COVERAGE_DIR)

ifdef TRAVIS_CI
COVERALLS := cat $(NODE_COVERAGE_DIR)/lcov.info | ./node_modules/coveralls/bin/coveralls.js
else
COVERALLS := echo skipping coveralls
endif

.PHONY: \
	node-test \
	node-coverage

node-test:
	$(HIDE)echo "Running jasmine-node tests"
	$(ENV)jasmine-node $(JASMINE_NODE_OPTS) $(NODE_SPECS)


node-coverage:
	$(HIDE)echo "Running istanbul cover jasmine-node tests"
	$(ENV)istanbul cover $(NODE_COVERAGE_OPTS) jasmine-node $(JASMINE_NODE_OPTS) $(NODE_SPECS) && $(COVERALLS)
