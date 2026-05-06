#!/usr/bin/env bash
set -euo pipefail

resolve_dir() {
  local var_name="$1"
  local default_path="$2"
  local path="${!var_name:-$default_path}"

  if [ ! -d "$path" ]; then
    echo "Missing $var_name directory: $path" >&2
    echo "Clone it as a sibling repo or set $var_name to an existing checkout." >&2
    exit 1
  fi

  cd "$path" && pwd
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANUAL_DIR="$(resolve_dir MANUAL_DIR "$SCRIPT_DIR/../riscv-isa-manual")"
ASM_MANUAL_DIR="$(resolve_dir ASM_MANUAL_DIR "$SCRIPT_DIR/../riscv-asm-manual")"
SBI_DOC_DIR="$(resolve_dir SBI_DOC_DIR "$SCRIPT_DIR/../riscv-sbi-doc")"
IOMMU_DIR="$(resolve_dir IOMMU_DIR "$SCRIPT_DIR/../riscv-iommu")"
TRACE_SPEC_DIR="$(resolve_dir TRACE_SPEC_DIR "$SCRIPT_DIR/../riscv-trace-spec")"
ASCIIDOCTOR_MDX="${ASCIIDOCTOR_MDX:-/home/dmg/projects/asciidoctor/wrappers/asciidoctor-mdx}"

if [ -z "${ASDF_RUBY_VERSION:-}" ] && [ -f "$MANUAL_DIR/.tool-versions" ]; then
  RUBY_VERSION="$(awk '$1 == "ruby" { print $2; exit }' "$MANUAL_DIR/.tool-versions")"
  if [ -n "$RUBY_VERSION" ]; then
    export ASDF_RUBY_VERSION="$RUBY_VERSION"
  fi
fi

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

COMMON_MDX_OPTS=(
  --trace
  -a sectnums
  -a "revnumber=$DATE"
  -a 'revremark=DRAFT---NOT AN OFFICIAL RELEASE'
  -a docinfo=shared
)

ISA_MDX_OPTS=(
  "${COMMON_MDX_OPTS[@]}"
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

copy_generated_docs() {
  local source_build_dir="$1"
  local docs_dir="$2"

  mkdir -p "$docs_dir"
  rm -f "$docs_dir"/*.mdx "$docs_dir/sidebar.json"
  cp "$source_build_dir"/*.mdx "$docs_dir/"
  cp "$source_build_dir/sidebar.json" "$docs_dir/"
}

copy_images() {
  local source_dir="$1"
  local target_dir="$2"

  mkdir -p "$target_dir"
  if [ -d "$source_dir" ]; then
    cp -r "$source_dir/." "$target_dir/"
  fi
}

# Run from MANUAL_DIR so the .tool-versions Ruby version is picked up by asdf.
cd "$MANUAL_DIR"

echo "Building unprivileged MDX..."
mkdir -p build/unpriv
LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
  "${ISA_MDX_OPTS[@]}" "${MDX_REQUIRES[@]}" \
  -a "imagesdir=$MANUAL_DIR/src/images" \
  -a mdx-sidebar-dir=unprivileged \
  -D build/unpriv \
  "$WRAP_DIR/unpriv.adoc"

echo "Building privileged MDX..."
mkdir -p build/priv
LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
  "${ISA_MDX_OPTS[@]}" "${MDX_REQUIRES[@]}" \
  -a "imagesdir=$MANUAL_DIR/src/images" \
  -a mdx-sidebar-dir=privileged \
  -D build/priv \
  "$WRAP_DIR/priv.adoc"

echo "Copying to Docusaurus..."
copy_generated_docs "$MANUAL_DIR/build/unpriv" "$SCRIPT_DIR/docs/unprivileged"
copy_generated_docs "$MANUAL_DIR/build/priv" "$SCRIPT_DIR/docs/privileged"

echo "Copying images..."
copy_images "$MANUAL_DIR/src/images" "$SCRIPT_DIR/static/img/riscv-isa"

echo "Done. Run 'bun run build' or 'bun run start' to rebuild the site."
