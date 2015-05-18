#
# Makefile to define some node project make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

NODE_SPECS ?= spec
NODE_COVERAGE_DIR ?= .coverage
NODE_COVERAGE_OPTS ?= -x **/spec/** --report cobertura --report lcov --dir $(NODE_COVERAGE_DIR)
JASMINE_CONFIG_FILE ?= $(NODE_SPECS)/jasmine.json

.PHONY: \
	clean-jasmine-config \
	jasmine-config \
	jasmine-coverage \
	jasmine-coveralls \
	jasmine-test

clean-jasmine-config:
	$(HIDE)rm $(JASMINE_CONFIG_FILE)

jasmine-config: $(JASMINE_CONFIG_FILE)

$(JASMINE_CONFIG_FILE):
	$(HIDE)echo "{" > $@
	$(HIDE)echo "    \"spec_dir\": \"$(NODE_SPECS)\"," >> $@
	$(HIDE)echo "    \"spec_files\": [" >> $@
	$(HIDE)echo "        \"**/*spec.js\"" >> $@
	$(HIDE)echo "    ]," >> $@
	$(HIDE)echo "    \"helpers\": [" >> $@
	$(HIDE)echo "    ]" >> $@
	$(HIDE)echo "}" >> $@

jasmine-coveralls:
	$(ENV)cat $(NODE_COVERAGE_DIR)/lcov.info | coveralls

jasmine-coverage:
	$(HIDE)echo "Running istanbul coverage on jasmine node specs"
	$(ENV)JASMINE_CONFIG_PATH=$(JASMINE_CONFIG_FILE) istanbul cover $(NODE_COVERAGE_OPTS) jasmine

jasmine-test:
	$(HIDE)echo "Running jasmine node specs"
	$(ENV)JASMINE_CONFIG_PATH=$(JASMINE_CONFIG_FILE) jasmine

# =================================================================================================
# DEPRECATED

JASMINE_NODE_OPTS ?= --captureExceptions --verbose
ifdef TRAVIS_CI
COVERALLS := cat $(NODE_COVERAGE_DIR)/lcov.info | ./node_modules/coveralls/bin/coveralls.js
else
COVERALLS := echo skipping coveralls
endif

.PHONY: \
	node-test \
	node-coverage

node-test:
	$(HIDE)echo "WARNING: 'node-test' target is DEPRECATED, use 'jasmine-test' instead"
	$(HIDE)echo "Running jasmine-node tests"
	$(ENV)jasmine-node $(JASMINE_NODE_OPTS) $(NODE_SPECS)

node-coverage:
	$(HIDE)echo "WARNING: 'node-coverage' target is DEPRECATED, use 'jasmine-coverage' instead"
	$(HIDE)echo "Running istanbul cover jasmine-node tests"
	$(ENV)istanbul cover $(NODE_COVERAGE_OPTS) jasmine-node $(JASMINE_NODE_OPTS) $(NODE_SPECS) && $(COVERALLS)

# =================================================================================================
