#! /bin/bash

rm -rf ./_site/
bundle exec jekyll build
cp -r ./_site/* ../longlinht.github.io/
cd ../longlinht.github.io || exit
git add .
git commit -a -m "update master"
git push
