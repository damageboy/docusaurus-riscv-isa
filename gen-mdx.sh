#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANUAL_DIR="$(cd "$SCRIPT_DIR/../riscv-isa-manual" && pwd)"

echo "Building MDX files..."
(cd "$MANUAL_DIR" && make -j2 build-mdx-unpriv build-mdx-priv)

echo "Copying to Docusaurus..."
cp "$MANUAL_DIR/build/unpriv/"*.mdx "$SCRIPT_DIR/docs/unprivileged/"
cp "$MANUAL_DIR/build/priv/"*.mdx   "$SCRIPT_DIR/docs/privileged/"

echo "Done. Run 'npm run build' or 'npm run start' to rebuild the site."
