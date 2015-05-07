#
# Makefile for {{ projectName }}
# Copyright (c) {{ year }} {{ company }}. All rights reserved.
#

GITHUB_HOST := {{ githubHost }}
REPO := {{ githubUser }}/{{ projectName }}

# Uncomment these if you want to override the default Selenium configs
#SELENIUM_HOST ?= {{ seleniumHost }}
#SELENIUM_PORT ?= {{ seleniumPort }}
#SELENIUM_BROWSER ?= {{ seleniumBrowser }}

-include node_modules/beaker/make/common.mk
-include node_modules/beaker/make/gh-pages.mk
-include node_modules/beaker/make/webpack-targets.mk

.PHONY: install clean test coverage report-coverage release ghp-update

# NOTE: install target will not have loaded the include above
# from beaker, so you don't have the ENV or SHELL variables set
# The karma-jasmine-jquery package doesn't do postinstall properly when a peer dep,
# So we do its postinstall step again at the end
install:
	$(HIDE)npm install
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
