#
# Makefile to define some e2e make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

NODE_SPECS ?= spec/e2e
TEST_PORT := $(shell perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); $$port = int(rand(1080))+1080; ++$$port until bind S, sockaddr_in($$port,inet_aton("127.1")); print $$port')
TEST_CONFIG := spec/e2e/test-config.json
HOSTNAME ?= $(shell hostname)
SELENIUM_HOST ?= localhost
SELENIUM_PORT ?= 4444
SELENIUM_BROWSER ?= chrome

.PHONY: \
	webdriver \
	kill-httpserver \
	start-httpserver \
	e2e-test \
	create-config \
	clean-screenshots \
	remote-e2e-test

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

SCREENSHOTS_DIR := spec/e2e/screenshots
clean-screenshots:
	$(HIDE)echo "Removing everything but *.baseline.png files from $(SCREENSHOTS_DIR)"
	$(HIDE)find $(SCREENSHOTS_DIR) -type f ! -name *.baseline.png -exec rm -f {} \; || echo "No screenshots present"

do-e2e-test:
ifndef JASMINE_CONFIG_FILE
	$(error JASMINE_CONFIG_FILE variable needs to be set. Maybe include 'node-targets.mk' first?)
endif

	$(HIDE)echo "Running e2e tests on port $(TEST_PORT)"
	$(ENV)JASMINE_CONFIG_PATH=$(JASMINE_CONFIG_FILE) jasmine || ($(ENV)kill $$(lsof -t -i:$(TEST_PORT)) && false)
	$(ENV)kill $$(lsof -t -i:$(TEST_PORT)) || echo 'nothing to kill'

# TODO: deprecate this and replace with a `make local-e2e-test` or something that
# spawns http-server and seleinum in the background, then runs the test
e2e-test: kill-httpserver build-mock start-httpserver create-config do-e2e-test

remote-e2e-test: build-mock do-remote-e2e-test
do-remote-e2e-test: clean-screenshots create-config
ifndef WEBDRIVERIO_SERVER
	$(error WEBDRIVERIO_SERVER variable needs to be set)
else
	$(ENV)$(BEAKER_BIN) webdriverioTester --server $(WEBDRIVERIO_SERVER) $(WEBDRIVERIO_SERVER_EXTRAS)
endif

update-screenshots:
	$(HIDE)for i in $$(find spec/e2e/screenshots -name '*.regression.png'); do mv $$i $${i/regression/baseline}; done
