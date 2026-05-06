# Add RISC-V Non-ISA Specs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Assembly, SBI, IOMMU, and Trace spec roots to the generated Docusaurus documentation site.

**Architecture:** Keep one Docusaurus docs plugin and extend the existing AsciiDoc-to-MDX generation pipeline. Each upstream repo generates into `docs/<slug>/` with its own `sidebar.json`, image namespace, navbar entry, and CI checkout/stamp input.

**Tech Stack:** Bash (`gen-mdx.sh`), GitHub Actions, Docusaurus 3.x, `asciidoctor-mdx`, Bun.

---

## File structure

- Modify `gen-mdx.sh`: add source-dir resolution, reusable conversion helpers, four new spec generation steps, SBI revision snippet generation, and image copying for each new spec.
- Modify `sidebars.js`: import four new generated sidebars and export four new sidebar ids.
- Modify `docusaurus.config.js`: add navbar entries for Assembly, SBI, IOMMU, and Trace.
- Modify `.github/workflows/build-deploy.yml`: detect/check out all upstream repos, pass new env vars, and stamp combined upstream SHAs.
- Modify `README.md`: document new source repos, environment variables, and pipeline.
- Modify `.gitignore`: ignore generated combined stamp and generated images for new spec roots.
- Create `static/img/<spec>/.gitignore` and `static/img/<spec>/kroki/.gitignore` only if needed to keep empty image roots tracked; prefer parent `.gitignore` rules when possible.

## Task 1: Prepare local upstream repos for verification

**Files:**
- No repo file changes.

- [ ] **Step 1: Clone missing sibling repos with submodules**

Run:

```bash
set -euo pipefail
cd /home/dmg/projects
for repo in riscv-asm-manual riscv-sbi-doc riscv-iommu riscv-trace-spec; do
  if [ ! -d "$repo/.git" ]; then
    git clone --recurse-submodules "https://github.com/riscv-non-isa/$repo" "$repo"
  else
    git -C "$repo" submodule update --init --recursive
  fi
done
```

Expected: four sibling repositories exist under `/home/dmg/projects/` and required `docs-resources` submodules are initialized where used.

- [ ] **Step 2: Confirm source roots exist**

Run:

```bash
set -euo pipefail
test -f /home/dmg/projects/riscv-asm-manual/src/riscv-asm.adoc
test -f /home/dmg/projects/riscv-sbi-doc/riscv-sbi.adoc
test -f /home/dmg/projects/riscv-iommu/src/riscv-iommu.adoc
test -f /home/dmg/projects/riscv-trace-spec/header.adoc
```

Expected: command exits 0.

## Task 2: Extend `gen-mdx.sh` source resolution and helpers

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Replace top-level directory definitions with resolver**

Change the initial variable block to include these definitions after `SCRIPT_DIR`:

```bash
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
```

- [ ] **Step 2: Split shared MDX options from ISA-only options**

Create a shared options array before ISA-specific generation:

```bash
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
```

Replace existing uses of `MDX_OPTS[@]` for unprivileged/privileged with `ISA_MDX_OPTS[@]`.

- [ ] **Step 3: Add reusable copy helper**

Add this function before conversion calls:

```bash
copy_generated_docs() {
  local source_build_dir="$1"
  local docs_dir="$2"

  mkdir -p "$docs_dir"
  rm -f "$docs_dir"/*.mdx "$docs_dir/sidebar.json"
  cp "$source_build_dir"/*.mdx "$docs_dir/"
  cp "$source_build_dir/sidebar.json" "$docs_dir/"
}
```

- [ ] **Step 4: Add reusable image copy helper**

Add this function near `copy_generated_docs`:

```bash
copy_images() {
  local source_dir="$1"
  local target_dir="$2"

  mkdir -p "$target_dir"
  if [ -d "$source_dir" ]; then
    cp -r "$source_dir/." "$target_dir/"
  fi
}
```

- [ ] **Step 5: Run shell syntax check**

Run:

```bash
bash -n gen-mdx.sh
```

Expected: command exits 0.

## Task 3: Add new spec conversion steps to `gen-mdx.sh`

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Add generic converter function**

Add this function after helper functions:

```bash
build_spec_mdx() {
  local repo_dir="$1"
  local root_doc="$2"
  local build_subdir="$3"
  local docs_subdir="$4"
  local sidebar_dir="$5"
  local image_url="$6"
  local image_root="$7"
  local edit_url_base="$8"
  shift 8

  echo "Building $docs_subdir MDX..."
  mkdir -p "$repo_dir/build/$build_subdir"
  (
    cd "$repo_dir"
    LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
      "${COMMON_MDX_OPTS[@]}" \
      -a "github-edit-url-base=$edit_url_base" \
      -a "github-local-root=$repo_dir" \
      -a "mdx-images-url=$image_url" \
      -a "mdx-images-root=$image_root" \
      -a "mdx-sidebar-dir=$sidebar_dir" \
      "$@" \
      -D "build/$build_subdir" \
      "$root_doc"
  )

  copy_generated_docs "$repo_dir/build/$build_subdir" "$SCRIPT_DIR/docs/$docs_subdir"
}
```

- [ ] **Step 2: Replace manual copy block with helper calls**

Replace the existing `Copying to Docusaurus...` block with:

```bash
echo "Copying ISA docs to Docusaurus..."
copy_generated_docs "$MANUAL_DIR/build/unpriv" "$SCRIPT_DIR/docs/unprivileged"
copy_generated_docs "$MANUAL_DIR/build/priv" "$SCRIPT_DIR/docs/privileged"
```

- [ ] **Step 3: Add SBI revision snippet generation**

Before SBI conversion, add:

```bash
prepare_sbi_revision() {
  local snippet_dir="$SBI_DOC_DIR/autogenerated"
  local commit_date
  local git_version

  commit_date="$(git -C "$SBI_DOC_DIR" show -s --format=%ci | cut -d ' ' -f 1)"
  git_version="$(git -C "$SBI_DOC_DIR" describe --tags --always 2>/dev/null || git -C "$SBI_DOC_DIR" rev-parse --short HEAD)"

  mkdir -p "$snippet_dir"
  {
    echo ":revdate: $commit_date"
    echo ":revnumber: $git_version"
  } > "$snippet_dir/revision.adoc-snippet"
}

prepare_sbi_revision
```

- [ ] **Step 4: Add four conversion calls**

Add after ISA copy helper calls:

```bash
build_spec_mdx \
  "$ASM_MANUAL_DIR" \
  "src/riscv-asm.adoc" \
  "asm-manual" \
  "asm-manual" \
  "asm-manual" \
  "/img/riscv-asm-manual/" \
  "$ASM_MANUAL_DIR/docs-resources/images" \
  "https://github.com/riscv-non-isa/riscv-asm-manual/blob/main" \
  --require=asciidoctor-lists

build_spec_mdx \
  "$SBI_DOC_DIR" \
  "riscv-sbi.adoc" \
  "sbi" \
  "sbi" \
  "sbi" \
  "/img/riscv-sbi-doc/" \
  "$SBI_DOC_DIR/images" \
  "https://github.com/riscv-non-isa/riscv-sbi-doc/blob/master" \
  -a "bibtex-file=$SBI_DOC_DIR/src/references.bib" \
  --require=asciidoctor-bibtex

build_spec_mdx \
  "$IOMMU_DIR" \
  "src/riscv-iommu.adoc" \
  "iommu" \
  "iommu" \
  "iommu" \
  "/img/riscv-iommu/" \
  "$IOMMU_DIR/src/images" \
  "https://github.com/riscv-non-isa/riscv-iommu/blob/main" \
  -a "bibtex-file=$IOMMU_DIR/src/iommu.bib" \
  --require=asciidoctor-bibtex \
  --require=asciidoctor-lists

build_spec_mdx \
  "$TRACE_SPEC_DIR" \
  "header.adoc" \
  "trace" \
  "trace" \
  "trace" \
  "/img/riscv-trace-spec/" \
  "$TRACE_SPEC_DIR/images" \
  "https://github.com/riscv-non-isa/riscv-trace-spec/blob/main"
```

- [ ] **Step 5: Extend image copy block**

Replace the existing image copy block with:

```bash
echo "Copying images..."
copy_images "$MANUAL_DIR/src/images" "$SCRIPT_DIR/static/img/riscv-isa"
copy_images "$ASM_MANUAL_DIR/docs-resources/images" "$SCRIPT_DIR/static/img/riscv-asm-manual"
copy_images "$SBI_DOC_DIR/images" "$SCRIPT_DIR/static/img/riscv-sbi-doc"
copy_images "$IOMMU_DIR/src/images" "$SCRIPT_DIR/static/img/riscv-iommu"
copy_images "$TRACE_SPEC_DIR/images" "$SCRIPT_DIR/static/img/riscv-trace-spec"
```

- [ ] **Step 6: Run syntax check**

Run:

```bash
bash -n gen-mdx.sh
```

Expected: command exits 0.

- [ ] **Step 7: Run generator**

Run:

```bash
./gen-mdx.sh
```

Expected: `docs/asm-manual/sidebar.json`, `docs/sbi/sidebar.json`, `docs/iommu/sidebar.json`, and `docs/trace/sidebar.json` exist.

## Task 4: Wire generated sidebars into Docusaurus

**Files:**
- Modify: `sidebars.js`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: Add sidebar imports**

Modify top of `sidebars.js` to include:

```js
import asmManualData from './docs/asm-manual/sidebar.json';
import sbiData       from './docs/sbi/sidebar.json';
import iommuData     from './docs/iommu/sidebar.json';
import traceData     from './docs/trace/sidebar.json';
```

- [ ] **Step 2: Export new sidebars**

Modify default export in `sidebars.js` to include:

```js
  asmManualSidebar:  withPrefix(asmManualData),
  sbiSidebar:        withPrefix(sbiData),
  iommuSidebar:      withPrefix(iommuData),
  traceSidebar:      withPrefix(traceData),
```

Final export should include all six sidebars:

```js
export default {
  unprivilegedSidebar: withPrefix(unprivData),
  privilegedSidebar:   withPrefix(privData),
  asmManualSidebar:    withPrefix(asmManualData),
  sbiSidebar:          withPrefix(sbiData),
  iommuSidebar:        withPrefix(iommuData),
  traceSidebar:        withPrefix(traceData),
};
```

- [ ] **Step 3: Add navbar entries**

In `docusaurus.config.js`, add these `navbar.items` after Privileged:

```js
          {
            type: 'docSidebar',
            sidebarId: 'asmManualSidebar',
            position: 'left',
            label: 'Assembly',
          },
          {
            type: 'docSidebar',
            sidebarId: 'sbiSidebar',
            position: 'left',
            label: 'SBI',
          },
          {
            type: 'docSidebar',
            sidebarId: 'iommuSidebar',
            position: 'left',
            label: 'IOMMU',
          },
          {
            type: 'docSidebar',
            sidebarId: 'traceSidebar',
            position: 'left',
            label: 'Trace',
          },
```

- [ ] **Step 4: Run Docusaurus build**

Run:

```bash
bun run build
```

Expected: build exits 0. Existing broken anchor warnings may remain; new errors must be fixed before continuing.

## Task 5: Update CI workflow

**Files:**
- Modify: `.github/workflows/build-deploy.yml`

- [ ] **Step 1: Extend check outputs**

Update `jobs.check.outputs` to include:

```yaml
      isa_sha: ${{ steps.decide.outputs.isa_sha }}
      asm_sha: ${{ steps.decide.outputs.asm_sha }}
      sbi_sha: ${{ steps.decide.outputs.sbi_sha }}
      iommu_sha: ${{ steps.decide.outputs.iommu_sha }}
      trace_sha: ${{ steps.decide.outputs.trace_sha }}
      upstream_stamp: ${{ steps.decide.outputs.upstream_stamp }}
```

Keep `manual_sha` temporarily as an alias if other workflow steps still reference it during edit; remove alias after all references are updated.

- [ ] **Step 2: Replace upstream SHA lookup script**

Replace the `Decide whether to rebuild` shell body with:

```bash
set -euo pipefail

get_sha() {
  git ls-remote "$1" HEAD | cut -f1
}

ISA_SHA="$(get_sha https://github.com/riscv/riscv-isa-manual.git)"
ASM_SHA="$(get_sha https://github.com/riscv-non-isa/riscv-asm-manual.git)"
SBI_SHA="$(get_sha https://github.com/riscv-non-isa/riscv-sbi-doc.git)"
IOMMU_SHA="$(get_sha https://github.com/riscv-non-isa/riscv-iommu.git)"
TRACE_SHA="$(get_sha https://github.com/riscv-non-isa/riscv-trace-spec.git)"
UPSTREAM_STAMP="riscv-isa-manual=$ISA_SHA;riscv-asm-manual=$ASM_SHA;riscv-sbi-doc=$SBI_SHA;riscv-iommu=$IOMMU_SHA;riscv-trace-spec=$TRACE_SHA"

printf 'Upstream stamp: %s\n' "$UPSTREAM_STAMP"
{
  echo "isa_sha=$ISA_SHA"
  echo "asm_sha=$ASM_SHA"
  echo "sbi_sha=$SBI_SHA"
  echo "iommu_sha=$IOMMU_SHA"
  echo "trace_sha=$TRACE_SHA"
  echo "upstream_stamp=$UPSTREAM_STAMP"
} >> "$GITHUB_OUTPUT"

if [ "${{ github.event_name }}" != "schedule" ]; then
  echo "Non-schedule trigger (${{ github.event_name }}) — always build"
  echo "should_build=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

DEPLOYED_STAMP="$(curl -fsSL https://riscv.houmus.org/built-upstream-shas.txt 2>/dev/null | tr -d '[:space:]' || true)"
echo "Deployed stamp: ${DEPLOYED_STAMP:-<none>}"

if [ -z "$DEPLOYED_STAMP" ] || [ "$DEPLOYED_STAMP" != "$UPSTREAM_STAMP" ]; then
  echo "Upstream changed (or no stamp) — rebuild"
  echo "should_build=true" >> "$GITHUB_OUTPUT"
else
  echo "No upstream change — skip"
  echo "should_build=false" >> "$GITHUB_OUTPUT"
fi
```

- [ ] **Step 3: Update ISA checkout ref**

Change riscv-isa-manual checkout ref to:

```yaml
          ref: ${{ needs.check.outputs.isa_sha }}
```

- [ ] **Step 4: Add four checkout steps**

Add after ISA checkout:

```yaml
      - name: Checkout riscv-asm-manual
        uses: actions/checkout@v4
        with:
          repository: riscv-non-isa/riscv-asm-manual
          ref: ${{ needs.check.outputs.asm_sha }}
          path: riscv-asm-manual
          submodules: recursive

      - name: Checkout riscv-sbi-doc
        uses: actions/checkout@v4
        with:
          repository: riscv-non-isa/riscv-sbi-doc
          ref: ${{ needs.check.outputs.sbi_sha }}
          path: riscv-sbi-doc
          submodules: recursive

      - name: Checkout riscv-iommu
        uses: actions/checkout@v4
        with:
          repository: riscv-non-isa/riscv-iommu
          ref: ${{ needs.check.outputs.iommu_sha }}
          path: riscv-iommu
          submodules: recursive

      - name: Checkout riscv-trace-spec
        uses: actions/checkout@v4
        with:
          repository: riscv-non-isa/riscv-trace-spec
          ref: ${{ needs.check.outputs.trace_sha }}
          path: riscv-trace-spec
          submodules: recursive
```

- [ ] **Step 5: Update manual version step**

Change environment refs in version step from `manual_sha` to `isa_sha`:

```bash
FULL_SHA=$(git rev-parse HEAD)
```

The script body can stay the same except the checkout already pins `isa_sha`.

- [ ] **Step 6: Pass new env vars to generator**

Update `Generate MDX docs` env block:

```yaml
        env:
          MANUAL_DIR: ${{ github.workspace }}/riscv-isa-manual
          ASM_MANUAL_DIR: ${{ github.workspace }}/riscv-asm-manual
          SBI_DOC_DIR: ${{ github.workspace }}/riscv-sbi-doc
          IOMMU_DIR: ${{ github.workspace }}/riscv-iommu
          TRACE_SPEC_DIR: ${{ github.workspace }}/riscv-trace-spec
```

- [ ] **Step 7: Replace stamp step**

Replace current stamp step with:

```yaml
      - name: Stamp built upstream SHAs
        run: echo '${{ needs.check.outputs.upstream_stamp }}' > static/built-upstream-shas.txt
```

- [ ] **Step 8: Update cache paths**

Update Kroki cache path to keep current cache and allow future global cache:

```yaml
          path: |
            static/img/riscv-isa/kroki
```

No new cache path is needed unless `remark-kroki-plugin` config changes.

## Task 6: Update docs and ignore rules

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Update README intro**

Replace first paragraph with:

```markdown
A searchable, navigable web rendition of the [RISC-V ISA Manual](https://github.com/riscv/riscv-isa-manual) plus selected RISC-V non-ISA specifications, live at **https://riscv.houmus.org**.
```

- [ ] **Step 2: Update pipeline diagram**

Replace the existing pipeline code block with one that includes:

```text
riscv-isa-manual/src/{unpriv,priv/priv}.adoc
riscv-asm-manual/src/riscv-asm.adoc
riscv-sbi-doc/riscv-sbi.adoc
riscv-iommu/src/riscv-iommu.adoc
riscv-trace-spec/header.adoc
    └─ gen-mdx.sh
         └─ calls asciidoctor-mdx
              ├─ docs/{unprivileged,privileged,asm-manual,sbi,iommu,trace}/*.mdx
              ├─ docs/{unprivileged,privileged,asm-manual,sbi,iommu,trace}/sidebar.json
              └─ static/img/<spec>/
```

- [ ] **Step 3: Update clone instructions**

Add after existing ISA clone command:

```bash
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-asm-manual ../riscv-asm-manual
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-sbi-doc ../riscv-sbi-doc
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-iommu ../riscv-iommu
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-trace-spec ../riscv-trace-spec
```

- [ ] **Step 4: Update environment variable table**

Add rows:

```markdown
| `ASM_MANUAL_DIR` | `../riscv-asm-manual` | Path to the RISC-V assembly manual checkout |
| `SBI_DOC_DIR` | `../riscv-sbi-doc` | Path to the RISC-V SBI spec checkout |
| `IOMMU_DIR` | `../riscv-iommu` | Path to the RISC-V IOMMU spec checkout |
| `TRACE_SPEC_DIR` | `../riscv-trace-spec` | Path to the RISC-V trace spec checkout |
```

- [ ] **Step 5: Update generated docs sentence**

Replace mentions of only `docs/unprivileged/` and `docs/privileged/` with:

```markdown
The generated MDX files and sidebar JSONs land in `docs/unprivileged/`, `docs/privileged/`, `docs/asm-manual/`, `docs/sbi/`, `docs/iommu/`, and `docs/trace/` (gitignored — never hand-edit them).
```

- [ ] **Step 6: Update `.gitignore` stamp rule**

Add:

```gitignore
/static/built-upstream-shas.txt
```

Keep `/static/built-manual-sha.txt` if deployed site still serves old stamp during transition.

## Task 7: Full verification and commit

**Files:**
- All modified files from previous tasks.
- Generated docs and images remain ignored.

- [ ] **Step 1: Run generator**

Run:

```bash
./gen-mdx.sh
```

Expected: command exits 0 and prints completion message.

- [ ] **Step 2: Verify generated sidebars exist**

Run:

```bash
set -euo pipefail
for dir in unprivileged privileged asm-manual sbi iommu trace; do
  test -f "docs/$dir/sidebar.json"
done
```

Expected: command exits 0.

- [ ] **Step 3: Run build**

Run:

```bash
bun run build
```

Expected: command exits 0. Existing broken-anchor warnings are acceptable only if they match pre-existing generated ISA warnings; new fatal errors are not acceptable.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: modified tracked files include `gen-mdx.sh`, `sidebars.js`, `docusaurus.config.js`, `.github/workflows/build-deploy.yml`, `README.md`, and `.gitignore`. Generated `docs/*` and `static/img/*` outputs should be ignored.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add gen-mdx.sh sidebars.js docusaurus.config.js .github/workflows/build-deploy.yml README.md .gitignore
git commit -m "feat: add non-ISA spec roots"
```

Expected: commit succeeds.

## Self-review notes

- Spec coverage: generation, Docusaurus sidebars/navbar, CI checkout/stamp, README, ignore rules, and verification are covered.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation instructions remain.
- Type/name consistency: slugs are consistently `asm-manual`, `sbi`, `iommu`, `trace`; sidebar ids are consistently `asmManualSidebar`, `sbiSidebar`, `iommuSidebar`, `traceSidebar`.
