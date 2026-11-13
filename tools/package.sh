#!/bin/sh
# Package the static site; development tools and design artifacts stay local.
set -eu
if [ "$#" -ne 1 ]; then
  echo 'Usage: sh tools/package.sh /absolute/path/ibmty.tar.gz' >&2
  exit 1
fi
case "$1" in /*) ;; *) echo 'Use an absolute output path.' >&2; exit 1 ;; esac
if [ -e "$1" ]; then echo 'Output already exists; choose a new path.' >&2; exit 1; fi
cd "$(dirname "$0")/.."
node tools/verify.mjs
COPYFILE_DISABLE=1 tar --exclude='.DS_Store' --exclude='.gitkeep' -czf "$1" \
  .htaccess index.html pages app assets sw.js service-worker manifest.webmanifest robots.txt \
  vendor THIRD_PARTY_NOTICES.md
