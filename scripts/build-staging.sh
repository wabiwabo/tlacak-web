#!/usr/bin/env bash
# OneFleet — staging build.
# Builds the SPA and substitutes the backend Velocity placeholders in
# index.html (${colorPrimary}/${title}/${description}) which are NOT
# substituted when the SPA is served outside the Traccar backend.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building (npm run build -> build/) ..."
npm run build

INDEX="build/index.html"
echo "==> Substituting placeholders in ${INDEX}"
sed -i \
  -e 's/\${colorPrimary}/#1a73e8/g' \
  -e 's/\${title}/OneFleet/g' \
  -e 's/\${description}/OneFleet GPS Tracking/g' \
  "${INDEX}"

if grep -qE '\$\{[a-zA-Z]+\}' "${INDEX}"; then
  echo "ERROR: unsubstituted placeholders remain in ${INDEX}:" >&2
  grep -oE '\$\{[a-zA-Z]+\}' "${INDEX}" | sort -u >&2
  exit 1
fi

echo "==> Done. Static site ready in $(pwd)/build"
echo "    Served by nginx at https://1f.val.id (no nginx reload needed for static files)."
