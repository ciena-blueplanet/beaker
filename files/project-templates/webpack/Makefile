#
# Makefile for {{ projectName }}
# Copyright (c) {{ year }} {{ company }}. All rights reserved.
#

GITHUB_HOST := github.com
REPO := {{ githubUser }}/{{ projectName }}

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
	$(HIDE)node node_modules/.bin/webdriver-manager update --standalone


clean:
	$(HIDE)rm -rf coverage demo/bundle

start-selenium:
	$(ENV)webdriver-manager start &

stop-selenium:
	$(ENV)kill -9 $$(lsof -t -i:4444) || echo 'nothing to kill'
	$(HIDE)ps aux | grep webdriver | grep -v grep | awk '{ print $$2; }' | xargs kill -9

test: webpack-test start-selenium e2e-test stop-selenium

coverage: webpack-coverage

report-coverage:
	$(HIDE)echo "Reporting Coverage not implemented yet"

release:
	$(HIDE)echo "Publishing version $(VERSION)"
	$(HIDE)npm publish .

ghp-update: build ghp-clean ghp-checkout ghp-copy-webpack ghp-publish
