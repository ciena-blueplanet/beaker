#!/bin/bash

#
# Script to create an initial gh-pages branch on upstream
#

git symbolic-ref HEAD refs/heads/gh-pages
rm .git/index
git clean -fdx

cat <<EOT >> index.html
<html>
    <head>
        <script>
            window.location.replace('./demo/');
        </script>
    </head>
</html>
EOT

git add .
git commit -a -m "Initial commit."
git push upstream gh-pages
