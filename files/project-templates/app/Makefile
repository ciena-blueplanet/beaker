#
# Makefile for {{ projectName }}
# Copyright (c) {{ year }} {{ company }}. All rights reserved.
#

GITHUB_HOST := github.com
REPO := {{ githubUser }}/{{ projectName }}
PROJECT_NAME := {{ projectName }}

-include node_modules/beaker/make/common.mk
-include node_modules/beaker/make/gh-pages.mk
-include node_modules/beaker/make/webpack-targets.mk

.PHONY: install clean test coverage report-coverage release ghp-update

install:
	# NOTE: install target will not have loaded the include above
	# from beaker, so you don't have the ENV or SHELL variables set
	$(eval ENV := source env.sh && )
	$(eval SHELL := bash)
	$(HIDE)npm install
	# The karma-jasmine-jquery package doesn't do postinstall properly when a peer dep,
	# So we do it's postinstall step again at the end
	$(HIDE)cd node_modules/karma-jasmine-jquery && node install.js

clean:
	$(HIDE)rm -rf bundle

test: webpack-test

coverage: webpack-coverage

report-coverage:
	$(HIDE)echo "Reporting Coverage not implemented yet"

release: build
	$(HIDE)echo "Publishing version $(VERSION)"
	$(HIDE)npm publish .

ghp-update: ghp-clean ghp-checkout ghp-copy-app ghp-publish
