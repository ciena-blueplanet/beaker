#
# Makefile to define some webpack project make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

NODE_SPECS ?= spec/e2e
JASMINE_NODE_OPTS ?= --captureExceptions --verbose
TEST_PORT := $(shell perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); $$port = int(rand(1080))+1080; ++$$port until bind S, sockaddr_in($$port,inet_aton("127.1")); print $$port')
TEST_CONFIG := spec/e2e/test-config.json
HOSTNAME ?= $(shell hostname)
SELENIUM_HOST ?= localhost
SELENIUM_PORT ?= 4444
SELENIUM_BROWSER ?= chrome

.PHONY: \
	webpack-test \
	webpack-coverage \
	create-config \
	remote-e2e-test

#######################################################################
#                          e2e test targets                           #
#######################################################################

create-config:
	$(HIDE)echo "{" > $(TEST_CONFIG)
	$(HIDE)echo "    \"selenium\": {" >> $(TEST_CONFIG)
	$(HIDE)echo "        \"host\": \"$(SELENIUM_HOST)\"," >> $(TEST_CONFIG)
	$(HIDE)echo "        \"port\": \"$(SELENIUM_PORT)\"," >> $(TEST_CONFIG)
	$(HIDE)echo "        \"browser\": \"$(SELENIUM_BROWSER)\"" >> $(TEST_CONFIG)
	$(HIDE)echo "    }," >> $(TEST_CONFIG)
	$(HIDE)echo "    \"http\": {" >> $(TEST_CONFIG)
	$(HIDE)echo "        \"host\": \"$(HOSTNAME)\"," >> $(TEST_CONFIG)
	$(HIDE)echo "        \"port\": \"$(TEST_PORT)\"," >> $(TEST_CONFIG)
	$(HIDE)echo "        \"entryPoint\": \"/demo\"" >> $(TEST_CONFIG)
	$(HIDE)echo "    }," >> $(TEST_CONFIG)
	$(HIDE)echo "    \"seleniumServer\": \"$(SELENIUM_HOST)\"," >> $(TEST_CONFIG) # for backward-compatibility
	$(HIDE)echo "    \"url\": \"http://$(HOSTNAME):$(TEST_PORT)/demo\"" >> $(TEST_CONFIG) # for backwrd-compatibility
	$(HIDE)echo "}" >> $(TEST_CONFIG)

remote-e2e-test: build-mock do-remote-e2e-test
do-remote-e2e-test: create-config
ifndef WEBDRIVERIO_SERVER
	$(error WEBDRIVERIO_SERVER variable needs to be set)
else
	$(ENV)$(BEAKER_BIN) webdriverioTester --server $(WEBDRIVERIO_SERVER) $(WEBDRIVERIO_SERVER_EXTRAS)
endif

update-screenshots:
	$(HIDE)for i in $$(find spec/e2e/screenshots -name '*.regression.png'); do mv $$i $${i/regression/baseline}; done

#######################################################################
#                         normal test targets                         #
#######################################################################

KARMA_CONFIG := node_modules/beaker/config/karma/config.js
karma:
	$(HIDE)echo "WARNING: the 'karma' target is DEPRECATED.
	$(HIDE)echo "Running Karma Server"
	$(ENV)karma start $(KARMA_CONFIG)

%.test:
	$(HIDE)echo "WARNING: the '*.test' target is DEPRECATED.
	$(ENV)karma run $(KARMA_CONFIG) -- --grep=$(subst .test,,$@)

webpack-watch-test:
	$(HIDE)echo "WARNING: the 'webpack-watch-test' target is DEPRECATED. Use 'karma-watch' instead."
	$(HIDE)echo "Running Karma webpack tests (with watching)"
	$(ENV)grunt karma:unit watch:karma

webpack-test:
	$(HIDE)echo "WARNING: the 'webpack-test' target is DEPRECATED. Use 'karma-test' instead."
	$(HIDE)echo "Running Karma webpack tests once"
	$(ENV)grunt test

webpack-coverage:
	$(HIDE)echo "WARNING: the 'webpack-coverage' target is DEPRECATED. Use 'karma-coverage' instead."
	$(HIDE)echo "Running Karma webpack tests (with coverage)"
	$(ENV)grunt test-coverage
