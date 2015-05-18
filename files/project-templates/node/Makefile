#
# Makefile for {{ projectName }}
# Copyright (c) {{ year }} {{ company }}. All rights reserved.
#

GITHUB_HOST := github.com
REPO := {{ githubUser }}/{{ projectName }}
NODE_COVERAGE_DIR := coverage

-include node_modules/beaker/make/common.mk
-include node_modules/beaker/make/gh-pages.mk
-include node_modules/beaker/make/node-targets.mk

.PHONY: install test coverage report-coverage release ghp-update

install:
	$(HIDE)npm install

clean:
	$(HIDE)rm -rf $(NODE_COVERAGE_DIR)

test: jasmine-test

coverage: jasmine-coverage

report-coverage:
	$(HIDE)echo "Reporting Coverage not implemented yet"

release:
	$(HIDE)echo "Publishing version $(VERSION)"
	$(HIDE)npm publish .

ghp-update: ghp-clean ghp-checkout ghp-copy-node ghp-publish
