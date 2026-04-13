#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANUAL_DIR="${MANUAL_DIR:-$(cd "$SCRIPT_DIR/../riscv-isa-manual" && pwd)}"
ASCIIDOCTOR_MDX="${ASCIIDOCTOR_MDX:-/home/dmg/projects/asciidoctor/wrappers/asciidoctor-mdx}"

# Create temp wrapper adoc files that prepend symbols.adoc to each volume.
# This is necessary because the per-volume files (unpriv.adoc, priv/priv.adoc)
# depend on the parent riscv-spec.adoc to include symbols.adoc first — we
# replicate that here without touching the upstream source.
WRAP_DIR="$(mktemp -d)"
trap 'rm -rf "$WRAP_DIR"' EXIT

cat > "$WRAP_DIR/unpriv.adoc" <<EOF
include::$MANUAL_DIR/src/symbols.adoc[]
include::$MANUAL_DIR/src/unpriv.adoc[]
EOF

cat > "$WRAP_DIR/priv.adoc" <<EOF
include::$MANUAL_DIR/src/symbols.adoc[]
include::$MANUAL_DIR/src/priv/priv.adoc[]
EOF

DATE="$(date +%Y%m%d)"

MDX_OPTS=(
  --trace
  --sourcemap
  -a sectnums
  -a "revnumber=$DATE"
  -a 'revremark=DRAFT---NOT AN OFFICIAL RELEASE'
  -a docinfo=shared
  -a "bibtex-file=$MANUAL_DIR/src/resources/riscv-spec.bib"
  -a "github-edit-url-base=https://github.com/riscv/riscv-isa-manual/blob/main"
  -a "github-local-root=$MANUAL_DIR"
  -a 'mdx-images-url=/img/riscv-isa/'
  -a "mdx-images-root=$MANUAL_DIR/src/images"
)

MDX_REQUIRES=(
  --require=asciidoctor-bibtex
  --require=asciidoctor-lists
  --require=asciidoctor-sail
)

# Run from MANUAL_DIR so the .tool-versions Ruby version is picked up by asdf.
cd "$MANUAL_DIR"

echo "Building unprivileged MDX..."
mkdir -p build/unpriv
LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
  "${MDX_OPTS[@]}" "${MDX_REQUIRES[@]}" \
  -a "imagesdir=$MANUAL_DIR/src/images" \
  -a mdx-sidebar-dir=unprivileged \
  -D build/unpriv \
  "$WRAP_DIR/unpriv.adoc"

echo "Building privileged MDX..."
mkdir -p build/priv
LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
  "${MDX_OPTS[@]}" "${MDX_REQUIRES[@]}" \
  -a "imagesdir=$MANUAL_DIR/src/images" \
  -a mdx-sidebar-dir=privileged \
  -D build/priv \
  "$WRAP_DIR/priv.adoc"

echo "Copying to Docusaurus..."
mkdir -p "$SCRIPT_DIR/docs/unprivileged" "$SCRIPT_DIR/docs/privileged"
cp "$MANUAL_DIR/build/unpriv/"*.mdx        "$SCRIPT_DIR/docs/unprivileged/"
cp "$MANUAL_DIR/build/unpriv/sidebar.json" "$SCRIPT_DIR/docs/unprivileged/"
cp "$MANUAL_DIR/build/priv/"*.mdx          "$SCRIPT_DIR/docs/privileged/"
cp "$MANUAL_DIR/build/priv/sidebar.json"   "$SCRIPT_DIR/docs/privileged/"

echo "Copying images..."
mkdir -p "$SCRIPT_DIR/static/img/riscv-isa"
cp -r "$MANUAL_DIR/src/images/." "$SCRIPT_DIR/static/img/riscv-isa/"

echo "Done. Run 'bun run build' or 'bun run start' to rebuild the site."
