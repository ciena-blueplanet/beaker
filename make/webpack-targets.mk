#
# Makefile to define some webpack project make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

NODE_SPECS ?= spec/e2e
JASMINE_NODE_OPTS ?= --captureExceptions --verbose
TEST_PORT := $(shell perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); $$port = int(rand(1080))+1080; ++$$port until bind S, sockaddr_in($$port,inet_aton("127.1")); print $$port')
TEST_CONFIG := spec/e2e/test-config.json
HOSTNAME ?= $(shell hostname)

.PHONY: \
	webpack-test \
	webpack-coverage \
	webdriver \
	kill-httpserver \
	start-httpserver \
	e2e-test

#######################################################################
#                          e2e test targets                           #
#######################################################################

webdriver:
	$(ENV)webdriver-manager start

kill-httpserver:
	$(ENV)kill $$(lsof -t -i:$(TEST_PORT)) || echo 'nothing to kill'

start-httpserver:
	$(ENV)http-server -s -c-1 -p $(TEST_PORT) &

create-config:
	$(HIDE)echo '{ "seleniumServer": "michelangelo", "url": "http://$(HOSTNAME):$(TEST_PORT)/demo" }' > $(TEST_CONFIG)

create-config-local: create-config
	$(HIDE) sed -i -e "s/michelangelo/localhost/g" $(TEST_CONFIG)
	$(HIDE) rm -f $(TEST_CONFIG)-e

do-e2e-test:
	$(HIDE)echo "Running jasmine-node tests on port $(TEST_PORT)"
	$(ENV)jasmine-node $(JASMINE_NODE_OPTS) $(NODE_SPECS) || ($(ENV)kill $$(lsof -t -i:$(TEST_PORT)) && false)
	$(ENV)kill $$(lsof -t -i:$(TEST_PORT)) || echo 'nothing to kill'

e2e-test: kill-httpserver build-mock start-httpserver create-config do-e2e-test
e2e-test-local: kill-httpserver build-mock start-httpserver create-config-local do-e2e-test

#######################################################################
#                         normal test targets                         #
#######################################################################

KARMA_CONFIG := node_modules/beaker/config/karma/config.js
karma:
	$(HIDE)echo "Running Karma Server"
	$(ENV)karma start $(KARMA_CONFIG)

%.test:
	$(ENV)karma run $(KARMA_CONFIG) -- --grep=$(subst .test,,$@)

webpack-watch-test:
	$(HIDE)echo "Running Karma webpack tests (with watching)"
	$(ENV)grunt karma:unit watch:karma

webpack-test:
	$(HIDE)echo "Running Karma webpack tests once"
	$(ENV)grunt test

webpack-coverage:
	$(HIDE)echo "Running Karma webpack tests (with coverage)"
	$(ENV)grunt test-coverage
