# Add RISC-V AIA Spec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the RISC-V Advanced Interrupt Architecture specification as a generated Docusaurus doc root.

**Architecture:** Extend the existing single docs-plugin pipeline. `gen-mdx.sh` resolves `AIA_DIR`, converts `src/riscv-interrupts.adoc` into `docs/aia/`, and copies AIA images. Docusaurus, CI, README, and ignore rules receive the new root.

**Tech Stack:** Bash (`gen-mdx.sh`), Docusaurus 3.x, GitHub Actions, `asciidoctor-mdx`, Bun.

---

## File structure

- Modify `gen-mdx.sh`: add `AIA_DIR`, AIA conversion, image copying.
- Modify `sidebars.js`: import/export `aiaSidebar`.
- Modify `docusaurus.config.js`: add AIA navbar item.
- Modify `.github/workflows/build-deploy.yml`: add AIA SHA, checkout, generator env var.
- Modify `README.md`: document AIA source repo, env var, generated root.
- Modify `.gitignore`: ignore AIA generated images.

## Task 1: Prepare local AIA source repo

**Files:**
- No tracked file changes.

- [ ] **Step 1: Clone/update AIA source repo**

```bash
set -euo pipefail
cd /home/dmg/projects
if [ ! -d riscv-aia/.git ]; then
  git clone --recurse-submodules https://github.com/riscv/riscv-aia riscv-aia
else
  git -C riscv-aia submodule update --init --recursive
fi
```

Expected: `/home/dmg/projects/riscv-aia` exists.

- [ ] **Step 2: Verify source roots and images**

```bash
set -euo pipefail
test -f /home/dmg/projects/riscv-aia/src/riscv-interrupts.adoc
test -d /home/dmg/projects/riscv-aia/src
test -f /home/dmg/projects/riscv-aia/src/AdvPLIC-ex-1Domain.png
test -f /home/dmg/projects/riscv-aia/src/IOMMU-guestIntrFiles.png
```

Expected: command exits 0.

## Task 2: Extend generation script

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Add `AIA_DIR`**

After `DEBUG_SPEC_DIR`, add:

```bash
AIA_DIR="$(resolve_dir AIA_DIR "$SCRIPT_DIR/../riscv-aia")"
```

- [ ] **Step 2: Add AIA conversion call**

After Debug conversion and before image copy block, add:

```bash
build_spec_mdx \
	"$AIA_DIR" \
	"src/riscv-interrupts.adoc" \
	"aia" \
	"aia" \
	"aia" \
	"/img/riscv-aia/" \
	"$AIA_DIR/src" \
	"https://github.com/riscv/riscv-aia/blob/main" \
	-a "imagesdir=$AIA_DIR/src"
```

- [ ] **Step 3: Add AIA image copy**

Add to image copy block:

```bash
copy_images "$AIA_DIR/src" "$SCRIPT_DIR/static/img/riscv-aia"
```

- [ ] **Step 4: Validate generation**

```bash
bash -n gen-mdx.sh
./gen-mdx.sh
test -f docs/aia/sidebar.json
git -C /home/dmg/projects/riscv-aia status --short
```

Expected: generation exits 0, AIA sidebar exists, and AIA source repo status is clean.

- [ ] **Step 5: Build and commit**

```bash
bun run build
git add gen-mdx.sh
git commit -m "feat: generate RISC-V AIA spec"
```

Expected: build exits 0 and commit succeeds. If generated image dir is untracked, leave it for Task 5 ignore update.

## Task 3: Wire sidebar and navbar

**Files:**
- Modify: `sidebars.js`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: Add sidebar import**

In `sidebars.js`, add:

```js
import aiaData from "./docs/aia/sidebar.json";
```

- [ ] **Step 2: Add sidebar export**

Add to default export:

```js
	aiaSidebar: withPrefix(aiaData),
```

- [ ] **Step 3: Add navbar item**

In `docusaurus.config.js`, after `Debug`, add:

```js
					{
						type: "docSidebar",
						sidebarId: "aiaSidebar",
						position: "left",
						label: "AIA",
					},
```

- [ ] **Step 4: Build and commit**

```bash
bun run build
git add sidebars.js docusaurus.config.js
git commit -m "feat: add AIA spec navigation"
```

Expected: build exits 0.

## Task 4: Update CI

**Files:**
- Modify: `.github/workflows/build-deploy.yml`

- [ ] **Step 1: Add output**

In `jobs.check.outputs`, add:

```yaml
      aia_sha: ${{ steps.decide.outputs.aia_sha }}
```

- [ ] **Step 2: Add SHA lookup/stamp/output**

In decide script, add:

```bash
AIA_SHA="$(get_sha https://github.com/riscv/riscv-aia.git)"
```

Extend `UPSTREAM_STAMP`:

```bash
;riscv-aia=$AIA_SHA
```

Add to output block:

```bash
  echo "aia_sha=$AIA_SHA"
```

- [ ] **Step 3: Add checkout step**

After Debug checkout, add:

```yaml
      - name: Checkout riscv-aia
        uses: actions/checkout@v4
        with:
          repository: riscv/riscv-aia
          ref: ${{ needs.check.outputs.aia_sha }}
          path: riscv-aia
          submodules: recursive
```

- [ ] **Step 4: Add generator env var**

In `Generate MDX docs` env, add:

```yaml
          AIA_DIR: ${{ github.workspace }}/riscv-aia
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
git commit -m "ci: build RISC-V AIA spec"
```

Expected: YAML parse and build exit 0.

## Task 5: Update docs and ignores

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Add README clone command**

Add:

```bash
git clone --recurse-submodules https://github.com/riscv/riscv-aia ../riscv-aia
```

- [ ] **Step 2: Add README env var**

Add:

```markdown
| `AIA_DIR` | `../riscv-aia` | Path to the RISC-V AIA spec checkout |
```

- [ ] **Step 3: Update README pipeline/generated roots**

Add source root:

```text
riscv-aia/src/riscv-interrupts.adoc
```

Add generated root `aia` wherever generated doc roots are listed.

- [ ] **Step 4: Update `.gitignore`**

Add:

```gitignore
/static/img/riscv-aia/*
```

- [ ] **Step 5: Build and commit**

```bash
bun run build
git add README.md .gitignore
git commit -m "docs: document RISC-V AIA source"
```

Expected: build exits 0 and generated AIA images are ignored.

## Task 6: Full verification and push check

**Files:**
- No intended file changes.

- [ ] **Step 1: Regenerate all docs**

```bash
./gen-mdx.sh
```

Expected: exits 0.

- [ ] **Step 2: Verify sidebars**

```bash
set -euo pipefail
for dir in unprivileged privileged asm-manual sbi iommu trace server-platform control-transfer-records debug aia; do
  test -f "docs/$dir/sidebar.json"
done
```

Expected: exits 0.

- [ ] **Step 3: Verify AIA source repo clean**

```bash
git -C /home/dmg/projects/riscv-aia status --short
```

Expected: clean status.

- [ ] **Step 4: Build**

```bash
bun run build
```

Expected: exits 0. If Rspack cache panic appears, run `bun run clear` then rerun build.

- [ ] **Step 5: Check status**

```bash
git status --short
```

Expected: clean tracked tree.

- [ ] **Step 6: Push and watch GitHub Actions if user asks**

```bash
git push origin master
gh run list --limit 1 --json databaseId,status,conclusion,headSha,url
gh run watch <run-id> --exit-status
```

Expected: CI passes. Note elapsed build time compared with previous run to estimate AIA impact.

## Self-review notes

- Spec coverage: generation, nav/sidebar, CI checkout/stamp/env var, README/ignore, verification covered.
- Placeholder scan: no deferred implementation placeholders.
- Name consistency: slug `aia`, env `AIA_DIR`, sidebar `aiaSidebar`, label `AIA`.
