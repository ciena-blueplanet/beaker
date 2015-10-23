#
# Env script to be sourced in a bash shell to setup PATH properly
# Copyright 2015 Ciena Corporation All rights reserved.
#

bin/check-env.sh

#
# Utility to add a directory to PATH (if it's not there already)
# taken from http://superuser.com/a/39995
#
function pathadd() {
    if [ -d "$1" ] && [[ ":$PATH:" != *":$1:"* ]]; then
        PATH="$1:$PATH"
    fi
}

#
# NODE_PATH is searched whenever you 'require' a module in nodejs
# http://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
# In order to be able to load modules from our dependency's folders, we
# need to add the sub-node_modules to NODE_PATH
#
function nodepathadd() {
    if [ -d "$1" ] && [[ ":$NODE_PATH:" != *":$1:"* ]]; then
        NODE_PATH="$1:$NODE_PATH"
    fi
}

# Add the local ./node_modules/.bin to the front of PATH
pathadd ${PWD}/node_modules/.bin

# Export something that tells eslint where rules-dir is
export ESLINT_RULES_DIR="${PWD}/node_modules/beaker/src/eslint-rules"
