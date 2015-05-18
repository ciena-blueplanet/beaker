#
# Makefile for the beaker package
#

NODE_SPECS := spec/node
NODE_COVERAGE_DIR := node-coverage
REPO := cyaninc/beaker
IS_BEAKER := 1

-include make/common.mk
-include make/gh-pages.mk
-include make/node-targets.mk
-include make/karma-targets.mk

# Override the beaker binary, since we are beaker
BEAKER_BIN := ./bin/beaker.js

.PHONY: \
	install \
	clean \
	init-test \
	test \
	coverage \
	report-coverage \
	release \
	ghp-copy-custom \
	ghp-update

install:
	$(HIDE)npm install

clean:
	$(HIDE)rm -rf coverage node-coverage
	$(ENV)npm cache clean beaker

INIT_TEST_DIR := /tmp/.init-test
init-test: webpack.init-test node.init-test app.init-test

%.init-test:
	$(eval TYPE := $(subst .init-test,,$@))
	$(eval PROJECT_DIR := $(PWD))
	$(eval TEMP_PROJECT_DIR := $(INIT_TEST_DIR)/$(TYPE)-project)
	$(HIDE)rm -rf $(TEMP_PROJECT_DIR)
	$(HIDE)rm -rf ~/.npm/beaker
	$(HIDE)echo "Creating a new project in '$(TEMP_PROJECT_DIR)'"
	$(HIDE)mkdir -p $(TEMP_PROJECT_DIR)
	$(HIDE)cd $(TEMP_PROJECT_DIR) && echo "$$PWD"
	$(HIDE)cd $(TEMP_PROJECT_DIR) && npm install "$(PROJECT_DIR)"
	$(HIDE)cd $(TEMP_PROJECT_DIR) && ./node_modules/.bin/beaker newConfig
	$(HIDE)cd $(TEMP_PROJECT_DIR) && ./node_modules/.bin/beaker init --type $(TYPE)
	$(HIDE)cd $(TEMP_PROJECT_DIR) && make install
	$(HIDE)cd $(TEMP_PROJECT_DIR) && make lint
	$(HIDE)cd $(TEMP_PROJECT_DIR) && make test
	$(HIDE)cd $(TEMP_PROJECT_DIR) && make coverage
	# Since a local npm install runs pre-publish but not post-publish, we need to manually clean up
	$(HIDE)./bin/post-publish.sh
	$(HIDE)npm cache clean beaker

test: lint jasmine-test karma-test

coverage: node-coverage

report-coverage: jasmine-coveralls

ci-test: lint jasmine-test jasmine-coverage karma-test report-coverage

release:
	$(HIDE)echo "Publishing version $(VERSION)"
	$(HIDE)npm publish .

ghp-copy-custom:
	$(GHP_COPY) package.json $(GHP_TEMP_DIR)

ghp-update: ghp-clean ghp-checkout ghp-copy-custom ghp-copy-node ghp-publish
