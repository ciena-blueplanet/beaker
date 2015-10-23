#!/bin/bash

#
# Script to verify the proper versions of node/npm
#

declare -a SUPPORTED_NODE_VERSIONS=("v4.2.1")
declare -a SUPPORTED_NPM_VERSIONS=("3.3.9")

nodeVersion=$(node -v)
npmVersion=$(npm -v)

nodeSupported=0
for version in "${SUPPORTED_NODE_VERSIONS[@]}"
do
    if [ "${nodeVersion}" = "${version}" ]
    then
        nodeSupported=1
    fi
done

if [ ${nodeSupported} -ne 1 ]
then
    echo ""
    echo "WARNING: Your current node version [${nodeVersion}] does not match one of our supported versions:"
    echo "${SUPPORTED_NODE_VERSIONS}"
    echo "To install one of the supported versions, use the following command (replacing <VERSION> of course)"
    echo "nvm install <VERSION>"
    echo ""
fi

npmSupported=0
for version in "${SUPPORTED_NPM_VERSIONS[@]}"
do
    if [ "${npmVersion}" = "${version}" ]
    then
        npmSupported=1
    fi
done

if [ "${npmSupported}" != "1" ]
then
    echo ""
    echo "WARNING: Your current npm version [${npmVersion}] does not match one of our supported versions:"
    echo "${SUPPORTED_NPM_VERSIONS}"
    echo "To install one of the supported versions, use the following command (replacing <VERSION> of course)"
    echo "npm install -g npm@<VERSION>"
    echo ""
fi
