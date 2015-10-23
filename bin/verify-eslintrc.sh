#!/bin/bash

#
# Script to verify proper error handling in CLI
#

EXPECTED_DIFF=.expected-eslintrc-diff.txt
ACTUAL_DIFF=/tmp/diff.txt

diff .eslintrc lib/.eslintrc > ${ACTUAL_DIFF}

diff ${ACTUAL_DIFF} ${EXPECTED_DIFF}
ret=$?

if [ "${ret}" != "0" ]
then
    echo "ERROR: .eslintrc differs unexpectedly from lib/.eslintrc!"
    echo ""
    echo "================================================="
    echo "Expected Diff:"
    echo "================================================="
    echo ""
    cat ${EXPECTED_DIFF}
    echo "================================================="
    echo "Actual Diff:"
    echo "================================================="
    echo ""
    cat ${ACTUAL_DIFF}
    echo ""
fi

rm -f ${ACTUAL_DIFF}
exit ${ret}
