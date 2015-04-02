#
# Makefile to define some common toolkit make targets for working with gh-pages
# Copyright (c) 2015 Cyan, Inc. All rights reserved.
#

GHP_COPY := $(HIDE)/bin/cp -r
GHP_TEMP_DIR := /tmp/temp-gh-pages-repo

ifndef REPO
	GHP_REPO_URL ?= $(shell git remote -v | grep upstream | grep push | awk '{ print $$2; }')
else
	GHP_REPO_URL ?= git@$(GITHUB_HOST):$(REPO).git
endif

ghp-clean:
	$(HIDE)rm -rf $(GHP_TEMP_DIR)

ghp-checkout:
	$(HIDE)git clone $(GHP_REPO_URL) --branch gh-pages $(GHP_TEMP_DIR)

%.ghp-copy:
	$(GHP_COPY) $(subst .ghp-copy,,$@) $(GHP_TEMP_DIR) 2>/dev/null || :

ghp-copy-common:
	$(HIDE)rm -rf $(GHP_TEMP_DIR)/coverage
	$(HIDE)mkdir $(GHP_TEMP_DIR)/coverage
	$(HIDE)
		if [ -f coverage/index.html ]; \
		then \
			cd coverage && /bin/cp -r * $(GHP_TEMP_DIR)/coverage; \
		else \
			cd coverage/*/ && /bin/cp -r * $(GHP_TEMP_DIR)/coverage; \
		fi

GHP_COPY_WEBPACK ?= \
	demo.ghp-copy \
	package.json.ghp-copy

GHP_COPY_APP ?= \
	demo.ghp-copy \
	bundle.ghp-copy \
	package.json.ghp-copy

ghp-copy-webpack: ghp-copy-common $(GHP_COPY_WEBPACK)

ghp-copy-app: ghp-copy-common $(GHP_COPY_APP)

GHP_NODE_COVERAGE_DST ?= coverage
ghp-copy-node:
	$(HIDE)rm -rf $(GHP_TEMP_DIR)/$(GHP_NODE_COVERAGE_DST)
	$(HIDE)mkdir $(GHP_TEMP_DIR)/$(GHP_NODE_COVERAGE_DST)
	$(GHP_COPY) $(NODE_COVERAGE_DIR)/lcov-report/* $(GHP_TEMP_DIR)/$(GHP_NODE_COVERAGE_DST)

ghp-publish:
	$(HIDE)cd $(GHP_TEMP_DIR) &&\
		git add --all &&\
		git commit -m "Updating with content from $(VERSION)" &&\
		git push origin gh-pages
