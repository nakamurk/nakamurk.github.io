#!/bin/bash

dir="./xxx"
for i in `find -name "*.md" | sort`; do
  if [[ ${i} =~ node_modules ]]; then
    continue
  fi
  if [[ ${i%/*} != "${dir}" ]]; then
    echo -e "\n## ${i%/*}\n";
  fi;
  dir=${i%/*}
  echo "* [${i##*/}]($i)"
done > hoge.dat

for i in `find Mermaid -name "*.md" | sort`; do
  echo "* [${i##*/}]($i)"
  echo "### $i" >&2
  mmdc -i ${i} -e png >&2
done >> hoge.dat

mv hoge.dat me.md
