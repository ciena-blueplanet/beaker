#
# Makefile to define some karma make targets
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

.PHONY: \
	karma-coverage \
	karma-test \
	karma-watch

karma-coverage: export JASMINE=1
karma-coverage:
	$(HIDE)echo "Running Karma tests (with coverage)"
	$(ENV)grunt test-coverage

karma-watch: export JASMINE=1
karma-watch:
	$(HIDE)echo "Running Karma tests (with watching)"
	$(ENV)grunt karma:unit watch:karma

karma-test: export JASMINE=1
karma-test:
	$(HIDE)echo "Running Karma tests once"
	$(ENV)grunt test
