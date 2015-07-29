#!/bin/bash

#
# Script to verify proper error handling in CLI
#

EXPECTED_OUTPUT='Invalid command "foo"'
OUTPUT_FILE=.test-error-reporting-output

./bin/beaker.js foo > ${OUTPUT_FILE} 2>&1
OUTPUT=$(cat ${OUTPUT_FILE})
rm -f ${OUTPUT_FILE}

if [ "${OUTPUT}" != "${EXPECTED_OUTPUT}" ]
then
    echo "ERROR: actual output did not match expected output"
    echo "expected:"
    echo "${EXPECTED_OUTPUT}"
    echo "actual:"
    echo "${OUTPUT}"
    exit 1
fi
