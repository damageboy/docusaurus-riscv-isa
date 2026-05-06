# Add More RISC-V Spec Roots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Server Platform and Control Transfer Records as generated Docusaurus doc roots.

**Architecture:** Extend the existing single docs-plugin pipeline. `gen-mdx.sh` resolves two more sibling repos, converts each root through `build_spec_mdx`, copies images into per-spec namespaces, then Docusaurus imports two new sidebars and navbar entries. CI checks out both new upstreams and includes them in the combined upstream stamp.

**Tech Stack:** Bash (`gen-mdx.sh`), Docusaurus 3.x, GitHub Actions, `asciidoctor-mdx`, Bun.

---

## File structure

- Modify `gen-mdx.sh`: add `SERVER_PLATFORM_DIR` and `CTR_DIR`, conversion calls, image copy calls.
- Modify `sidebars.js`: import and export `serverPlatformSidebar` and `ctrSidebar`.
- Modify `docusaurus.config.js`: add navbar entries `Server Platform` and `CTR`.
- Modify `.github/workflows/build-deploy.yml`: add SHA outputs/checks, checkouts, generator env vars, stamp inputs.
- Modify `README.md`: document new source repos, env vars, generated roots.
- Modify `.gitignore`: ignore new generated image dirs.

## Task 1: Prepare local source repos

**Files:**
- No tracked file changes.

- [ ] **Step 1: Clone/update sibling repos**

```bash
set -euo pipefail
cd /home/dmg/projects
for spec in \
  "riscv-non-isa/riscv-server-platform" \
  "riscv/riscv-control-transfer-records"; do
  repo="${spec##*/}"
  if [ ! -d "$repo/.git" ]; then
    git clone --recurse-submodules "https://github.com/$spec" "$repo"
  else
    git -C "$repo" submodule update --init --recursive
  fi
done
```

Expected: both sibling repos exist.

- [ ] **Step 2: Verify roots**

```bash
set -euo pipefail
test -f /home/dmg/projects/riscv-server-platform/server_platform_header.adoc
test -f /home/dmg/projects/riscv-server-platform/server_platform.bib
test -d /home/dmg/projects/riscv-server-platform/images
test -f /home/dmg/projects/riscv-control-transfer-records/header.adoc
test -f /home/dmg/projects/riscv-control-transfer-records/example.bib
test -d /home/dmg/projects/riscv-control-transfer-records/docs-resources/images
```

Expected: command exits 0.

## Task 2: Extend generation script

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Add source dirs**

After `TRACE_SPEC_DIR`, add:

```bash
SERVER_PLATFORM_DIR="$(resolve_dir SERVER_PLATFORM_DIR "$SCRIPT_DIR/../riscv-server-platform")"
CTR_DIR="$(resolve_dir CTR_DIR "$SCRIPT_DIR/../riscv-control-transfer-records")"
```

- [ ] **Step 2: Add Server Platform conversion**

After Trace conversion, add:

```bash
build_spec_mdx \
	"$SERVER_PLATFORM_DIR" \
	"server_platform_header.adoc" \
	"server-platform" \
	"server-platform" \
	"server-platform" \
	"/img/riscv-server-platform/" \
	"$SERVER_PLATFORM_DIR/images" \
	"https://github.com/riscv-non-isa/riscv-server-platform/blob/main" \
	-a "bibtex-file=$SERVER_PLATFORM_DIR/server_platform.bib" \
	-a "imagesdir=$SERVER_PLATFORM_DIR" \
	--require=asciidoctor-bibtex
```

- [ ] **Step 3: Add CTR conversion**

After Server Platform conversion, add:

```bash
build_spec_mdx \
	"$CTR_DIR" \
	"header.adoc" \
	"control-transfer-records" \
	"control-transfer-records" \
	"control-transfer-records" \
	"/img/riscv-control-transfer-records/" \
	"$CTR_DIR/docs-resources/images" \
	"https://github.com/riscv/riscv-control-transfer-records/blob/main" \
	-a "bibtex-file=$CTR_DIR/example.bib" \
	-a "imagesdir=$CTR_DIR/docs-resources/images" \
	--require=asciidoctor-bibtex
```

- [ ] **Step 4: Copy images**

Add to image copy block:

```bash
copy_images "$SERVER_PLATFORM_DIR/images" "$SCRIPT_DIR/static/img/riscv-server-platform"
copy_images "$CTR_DIR/docs-resources/images" "$SCRIPT_DIR/static/img/riscv-control-transfer-records"
```

- [ ] **Step 5: Validate generation**

```bash
bash -n gen-mdx.sh
./gen-mdx.sh
set -euo pipefail
test -f docs/server-platform/sidebar.json
test -f docs/control-transfer-records/sidebar.json
```

Expected: all commands exit 0. If conversion needs extra attrs/requires, add the smallest necessary flags and document in summary.

- [ ] **Step 6: Build**

```bash
bun run build
```

Expected: exits 0. Existing broken-anchor warnings are acceptable.

- [ ] **Step 7: Commit**

```bash
git add gen-mdx.sh
git commit -m "feat: generate additional RISC-V specs"
```

## Task 3: Wire sidebars and navbar

**Files:**
- Modify: `sidebars.js`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: Add sidebar imports**

In `sidebars.js`, add:

```js
import serverPlatformData from "./docs/server-platform/sidebar.json";
import ctrData from "./docs/control-transfer-records/sidebar.json";
```

- [ ] **Step 2: Export sidebars**

Add to default export:

```js
	serverPlatformSidebar: withPrefix(serverPlatformData),
	ctrSidebar: withPrefix(ctrData),
```

- [ ] **Step 3: Add navbar items**

In `docusaurus.config.js`, after `Trace`, add:

```js
					{
						type: "docSidebar",
						sidebarId: "serverPlatformSidebar",
						position: "left",
						label: "Server Platform",
					},
					{
						type: "docSidebar",
						sidebarId: "ctrSidebar",
						position: "left",
						label: "CTR",
					},
```

- [ ] **Step 4: Validate and commit**

```bash
bun run build
git add sidebars.js docusaurus.config.js
git commit -m "feat: add additional RISC-V navigation"
```

Expected: build exits 0 and commit succeeds.

## Task 4: Update CI

**Files:**
- Modify: `.github/workflows/build-deploy.yml`

- [ ] **Step 1: Add outputs**

In `jobs.check.outputs`, add:

```yaml
      server_platform_sha: ${{ steps.decide.outputs.server_platform_sha }}
      ctr_sha: ${{ steps.decide.outputs.ctr_sha }}
```

- [ ] **Step 2: Add SHA lookup and stamp entries**

In decide script, add:

```bash
SERVER_PLATFORM_SHA="$(get_sha https://github.com/riscv-non-isa/riscv-server-platform.git)"
CTR_SHA="$(get_sha https://github.com/riscv/riscv-control-transfer-records.git)"
```

Extend `UPSTREAM_STAMP`:

```bash
;riscv-server-platform=$SERVER_PLATFORM_SHA;riscv-control-transfer-records=$CTR_SHA
```

Add outputs:

```bash
  echo "server_platform_sha=$SERVER_PLATFORM_SHA"
  echo "ctr_sha=$CTR_SHA"
```

- [ ] **Step 3: Add checkout steps**

After Trace checkout, add:

```yaml
      - name: Checkout riscv-server-platform
        uses: actions/checkout@v4
        with:
          repository: riscv-non-isa/riscv-server-platform
          ref: ${{ needs.check.outputs.server_platform_sha }}
          path: riscv-server-platform
          submodules: recursive

      - name: Checkout riscv-control-transfer-records
        uses: actions/checkout@v4
        with:
          repository: riscv/riscv-control-transfer-records
          ref: ${{ needs.check.outputs.ctr_sha }}
          path: riscv-control-transfer-records
          submodules: recursive
```

- [ ] **Step 4: Add generator env vars**

In `Generate MDX docs` env, add:

```yaml
          SERVER_PLATFORM_DIR: ${{ github.workspace }}/riscv-server-platform
          CTR_DIR: ${{ github.workspace }}/riscv-control-transfer-records
```

- [ ] **Step 5: Validate and commit**

```bash
python3 - <<'PY'
import yaml
from pathlib import Path
yaml.safe_load(Path('.github/workflows/build-deploy.yml').read_text())
PY
bun run build
git add .github/workflows/build-deploy.yml
git commit -m "ci: build additional RISC-V spec roots"
```

Expected: YAML parse and build exit 0.

## Task 5: Update docs and ignores

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Update README clone commands**

Add:

```bash
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-server-platform ../riscv-server-platform
git clone --recurse-submodules https://github.com/riscv/riscv-control-transfer-records ../riscv-control-transfer-records
```

- [ ] **Step 2: Update README env table**

Add:

```markdown
| `SERVER_PLATFORM_DIR` | `../riscv-server-platform` | Path to the RISC-V Server Platform spec checkout |
| `CTR_DIR` | `../riscv-control-transfer-records` | Path to the RISC-V Control Transfer Records spec checkout |
```

- [ ] **Step 3: Update README generated roots/pipeline**

Add these source roots to the pipeline:

```text
riscv-server-platform/server_platform_header.adoc
riscv-control-transfer-records/header.adoc
```

Add generated roots to docs lists:

```text
server-platform,control-transfer-records
```

- [ ] **Step 4: Update `.gitignore`**

Add:

```gitignore
/static/img/riscv-server-platform/*
/static/img/riscv-control-transfer-records/*
```

- [ ] **Step 5: Validate and commit**

```bash
bun run build
git add README.md .gitignore
git commit -m "docs: document additional RISC-V sources"
```

Expected: build exits 0.

## Task 6: Full verification

**Files:**
- No intended file changes.

- [ ] **Step 1: Regenerate**

```bash
./gen-mdx.sh
```

Expected: exits 0.

- [ ] **Step 2: Verify all sidebars**

```bash
set -euo pipefail
for dir in unprivileged privileged asm-manual sbi iommu trace server-platform control-transfer-records; do
  test -f "docs/$dir/sidebar.json"
done
```

Expected: exits 0.

- [ ] **Step 3: Verify upstream repos clean**

```bash
set -euo pipefail
for repo in riscv-server-platform riscv-control-transfer-records; do
  git -C "/home/dmg/projects/$repo" status --short
 done
```

Expected: no generated `build/` or other dirty outputs from `gen-mdx.sh`.

- [ ] **Step 4: Build**

```bash
bun run build
```

Expected: exits 0. If Rspack cache panic appears, run `bun run clear` and rerun build.

- [ ] **Step 5: Check status**

```bash
git status --short
```

Expected: clean tracked tree; generated docs/images ignored.

## Self-review notes

- Spec coverage: generation, Docusaurus sidebars/navbar, CI checkout/stamp, README, ignore rules, validation covered.
- Placeholder scan: no deferred implementation items.
- Consistent names: slugs `server-platform`, `control-transfer-records`; sidebar ids `serverPlatformSidebar`, `ctrSidebar`; env vars `SERVER_PLATFORM_DIR`, `CTR_DIR`.
