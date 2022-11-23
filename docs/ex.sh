#!/bin/bash

for i in `find WORK -name "*.md" | sort`; do
  echo "### $i" >&2
  mmdc -i ${i} -e png >&2
  mv ${i}* Mermaid
done > hoge.dat

for i in `find Mermaid -name "*.md" | sort`; do
  I=`basename $i`
  sed -i -e "/^\!/d" ${i}
  sed -i -e "s/\`\`\`mermaid/\!${I}\n\`\`\`mermaid/g" ${i}
  for p in `find Mermaid -name "${I}*.png"`; do
    P=`basename $p`
    : > tmp
    cat ${i} \
    | awk '/'\!${I}'/{c += 1;}
      c == 1 {
        gsub("!'${I}'", "!['${P}']('${P}')", $0)
      }
      {print $0}
      ' > tmp
    mv tmp ${i}
  done
done

dir="./xxx"
: > hoge.dat
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

mv hoge.dat me.md
