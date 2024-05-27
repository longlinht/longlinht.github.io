#! /bin/bash

bundle exec jekyll build
cp -r ./_site/* ../longlinht.github.io/
cd ../longlinht.github.io || exit
git commit -a -m "update"
git push
