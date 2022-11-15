#!/bin/bash

dir="./xxx"
for i in `find -name "*.md" | sort`; do
  if [[ ${i%/*} != ""${dir} ]]; then
    echo -e "\n## ${i%/*}\n";
  fi;
  dir=${i%/*}
  echo "* [${i##*/}]($i)"
done > hoge.dat
mv hoge.dat me.md
