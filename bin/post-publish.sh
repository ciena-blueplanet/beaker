#!/bin/bash

#
# Post-publish script to restores symlinks that were replaced in pre-publish
# Since npm doesn't like symlinks
#

symlinks=`find files -type l`

for sym in $symlinks
do
    orig=`echo $sym | sed -e "s/.orig-link//g"`
    echo "Moving $sym back to $orig"
    rm -rf $orig
    mv $sym $orig
done
