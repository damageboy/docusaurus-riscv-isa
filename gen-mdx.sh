#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANUAL_DIR="$(cd "$SCRIPT_DIR/../riscv-isa-manual" && pwd)"

echo "Building MDX files..."
(cd "$MANUAL_DIR" && make -j2 build-mdx-unpriv build-mdx-priv)

echo "Copying to Docusaurus..."
mkdir -p "$SCRIPT_DIR/docs/"{un,}privileged
cp "$MANUAL_DIR/build/unpriv/"*.mdx         "$SCRIPT_DIR/docs/unprivileged/"
cp "$MANUAL_DIR/build/unpriv/sidebar.json"  "$SCRIPT_DIR/docs/unprivileged/"
cp "$MANUAL_DIR/build/priv/"*.mdx           "$SCRIPT_DIR/docs/privileged/"
cp "$MANUAL_DIR/build/priv/sidebar.json"    "$SCRIPT_DIR/docs/privileged/"

echo "Copying images..."
mkdir -p "$SCRIPT_DIR/static/img/riscv-isa"
cp -r "$MANUAL_DIR/src/images/." "$SCRIPT_DIR/static/img/riscv-isa/"

echo "Done. Run 'npm run build' or 'npm run start' to rebuild the site."
