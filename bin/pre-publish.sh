#!/bin/bash

#
# Pre-publish script to replace symlinks with copies of files
# Since npm doesn't like symlinks
#

symlinks=`find files -type l`

for sym in $symlinks
do
    backup=${sym}.orig-link
    echo "Backing up $sym to $backup and copying dst"
    mv $sym $backup
    cp -RL $backup $sym
done
