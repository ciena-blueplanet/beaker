#
# Makefile to define some karma make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

ifeq ($(IS_BEAKER), 1)
KARMA_CONFIG := config/karma/config.js
else
KARMA_CONFIG := node_modules/beaker/config/karma/config.js
endif

.PHONY: \
	karma-coverage \
	karma-test \
	karma-watch

karma-coverage:
	$(HIDE)echo "Running Karma tests (with coverage)"
	$(ENV)grunt test-coverage

karma-watch:
	$(HIDE)echo "Running Karma tests (with watching)"
	$(ENV)grunt karma:unit watch:karma

karma-test:
	$(HIDE)echo "Running Karma tests once"
	$(ENV)grunt test
