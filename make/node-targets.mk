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

export JASMINE_CONFIG_PATH = $(JASMINE_CONFIG_FILE)
export NODE_SPECS
jasmine-coverage: export JASMINE=1
jasmine-coverage:
	$(HIDE)echo "Running istanbul coverage on jasmine node specs"
	$(HIDE)echo "Running jasmine node specs"
	$(ENV)istanbul cover $(NODE_COVERAGE_OPTS) jasmine

jasmine-test: export JASMINE=1
jasmine-test:
	$(HIDE)echo "Running jasmine node specs"
	$(ENV)jasmine
