#
# Makefile for {{ projectName }}
# Copyright (c) {{ year }} {{ company }}. All rights reserved.
#

GITHUB_HOST := {{ githubHost }}
REPO := {{ githubUser }}/{{ projectName }}
PROJECT_NAME := {{ projectName }}

-include node_modules/beaker/make/common.mk
-include node_modules/beaker/make/gh-pages.mk
-include node_modules/beaker/make/karma-targets.mk

.PHONY: install clean test coverage report-coverage release ghp-update

# NOTE: install target will not have loaded the include above
# from beaker, so you don't have the ENV or SHELL variables set
# The karma-jasmine-jquery package doesn't do postinstall properly when a peer dep,
# So we do its postinstall step again at the end
install:
	$(HIDE)npm install
	$(HIDE)cd node_modules/karma-jasmine-jquery && node install.js

clean:
	$(HIDE)rm -rf bundle coverage

test: karma-test

coverage: karma-coverage

report-coverage: karma-coveralls

release: build
	$(HIDE)echo "Publishing version $(VERSION)"
	$(HIDE)npm publish .

ghp-update: ghp-clean ghp-checkout ghp-copy-app ghp-publish
