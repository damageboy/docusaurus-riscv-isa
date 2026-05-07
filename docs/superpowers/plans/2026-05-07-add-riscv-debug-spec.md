# Add RISC-V Debug Spec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the RISC-V Debug Specification as a generated Docusaurus doc root.

**Architecture:** Extend the existing single docs-plugin pipeline. `gen-mdx.sh` will resolve `DEBUG_SPEC_DIR`, generate the Debug spec register definition AsciiDoc files, convert `riscv-debug-header.adoc` into `docs/debug/`, clean generated upstream artifacts, and copy images. Docusaurus, CI, README, and ignore rules then receive the new root.

**Tech Stack:** Bash (`gen-mdx.sh`), Python `sympy` via Debug spec `registers.py`, GNU Make, Docusaurus 3.x, GitHub Actions, `asciidoctor-mdx`, Bun.

---

## File structure

- Modify `gen-mdx.sh`: add `DEBUG_SPEC_DIR`, Debug register generation/cleanup helper, Debug conversion, image copying.
- Modify `sidebars.js`: import/export `debugSidebar`.
- Modify `docusaurus.config.js`: add Debug navbar item.
- Modify `.github/workflows/build-deploy.yml`: add Debug SHA, checkout, `sympy` install, generator env var.
- Modify `README.md`: document Debug source repo, env var, `sympy` prerequisite, generated root.
- Modify `.gitignore`: ignore Debug generated images.

## Task 1: Prepare local Debug source repo and Python prerequisite

**Files:**
- No tracked file changes.

- [ ] **Step 1: Clone/update Debug source repo**

```bash
set -euo pipefail
cd /home/dmg/projects
if [ ! -d riscv-debug-spec/.git ]; then
  git clone --recurse-submodules https://github.com/riscv/riscv-debug-spec riscv-debug-spec
else
  git -C riscv-debug-spec submodule update --init --recursive
fi
```

Expected: `/home/dmg/projects/riscv-debug-spec` exists.

- [ ] **Step 2: Verify source roots**

```bash
set -euo pipefail
test -f /home/dmg/projects/riscv-debug-spec/riscv-debug-header.adoc
test -f /home/dmg/projects/riscv-debug-spec/registers.py
test -f /home/dmg/projects/riscv-debug-spec/build/Makefile
test -d /home/dmg/projects/riscv-debug-spec/xml
test -d /home/dmg/projects/riscv-debug-spec/docs-resources/images
```

Expected: command exits 0.

- [ ] **Step 3: Install local Python prerequisite if missing**

```bash
python3 - <<'PY' || python3 -m pip install --user sympy
import sympy
PY
```

Expected: either `sympy` already imports or pip installs it. If pip is unavailable, stop and report the missing local prerequisite.

- [ ] **Step 4: Verify register generation manually**

```bash
set -euo pipefail
make -C /home/dmg/projects/riscv-debug-spec/build build-registers
test -f /home/dmg/projects/riscv-debug-spec/build/abstract_commands-def.adoc
test -f /home/dmg/projects/riscv-debug-spec/build/dm_registers-def.adoc
```

Expected: command exits 0.

- [ ] **Step 5: Clean manual generated files**

```bash
set -euo pipefail
git -C /home/dmg/projects/riscv-debug-spec clean -fd build
```

Expected: Debug source repo returns clean for generated `build/*.adoc` files.

## Task 2: Extend generation script

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Add `DEBUG_SPEC_DIR`**

After `CTR_DIR`, add:

```bash
DEBUG_SPEC_DIR="$(resolve_dir DEBUG_SPEC_DIR "$SCRIPT_DIR/../riscv-debug-spec")"
```

- [ ] **Step 2: Add Debug generated-file cleanup state**

Near existing SBI cleanup variables, add:

```bash
DEBUG_GENERATED_FILES=()
```

- [ ] **Step 3: Extend `cleanup()` to remove Debug generated files**

Before `rm -rf "$WRAP_DIR"`, add:

```bash
	if [ "${#DEBUG_GENERATED_FILES[@]}" -gt 0 ]; then
		rm -f "${DEBUG_GENERATED_FILES[@]}" || status=$?
	fi
```

- [ ] **Step 4: Add Debug register prep helper**

After `prepare_sbi_revision()`, add:

```bash
prepare_debug_registers() {
	local generated_names=(
		abstract_commands.adoc
		abstract_commands-def.adoc
		core_registers.adoc
		core_registers-def.adoc
		dm_registers.adoc
		dm_registers-def.adoc
		hwbp_registers.adoc
		hwbp_registers-def.adoc
		jtag_registers.adoc
		jtag_registers-def.adoc
		sample_registers.adoc
		sample_registers-def.adoc
		sw_registers.adoc
		sw_registers-def.adoc
	)
	local name
	local path

	DEBUG_GENERATED_FILES=()
	for name in "${generated_names[@]}"; do
		path="$DEBUG_SPEC_DIR/build/$name"
		if [ ! -e "$path" ]; then
			DEBUG_GENERATED_FILES+=("$path")
		fi
	done

	if ! python3 - <<'PY'
import sympy
PY
	then
		echo "Missing Python dependency: sympy" >&2
		echo "Install it with: python3 -m pip install --user sympy" >&2
		exit 1
	fi

	make -C "$DEBUG_SPEC_DIR/build" build-registers
}
```

- [ ] **Step 5: Add Debug conversion call**

After CTR conversion and before image copy block, add:

```bash
prepare_debug_registers
build_spec_mdx \
	"$DEBUG_SPEC_DIR" \
	"riscv-debug-header.adoc" \
	"debug" \
	"debug" \
	"debug" \
	"/img/riscv-debug-spec/" \
	"$DEBUG_SPEC_DIR/docs-resources/images" \
	"https://github.com/riscv/riscv-debug-spec/blob/main" \
	-a "imagesdir=$DEBUG_SPEC_DIR/docs-resources/images"
```

- [ ] **Step 6: Add Debug image copy**

Add to image copy block:

```bash
copy_images "$DEBUG_SPEC_DIR/docs-resources/images" "$SCRIPT_DIR/static/img/riscv-debug-spec"
```

- [ ] **Step 7: Validate generation**

```bash
bash -n gen-mdx.sh
./gen-mdx.sh
test -f docs/debug/sidebar.json
git -C /home/dmg/projects/riscv-debug-spec status --short
```

Expected: generation exits 0, Debug sidebar exists, and Debug source repo has no generated `build/*.adoc` dirt after script exit.

- [ ] **Step 8: Build and commit**

```bash
bun run build
git add gen-mdx.sh
git commit -m "feat: generate RISC-V debug spec"
```

Expected: build exits 0 and commit succeeds.

## Task 3: Wire sidebar and navbar

**Files:**
- Modify: `sidebars.js`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: Add sidebar import**

In `sidebars.js`, add:

```js
import debugData from "./docs/debug/sidebar.json";
```

- [ ] **Step 2: Add sidebar export**

Add to default export:

```js
	debugSidebar: withPrefix(debugData),
```

- [ ] **Step 3: Add navbar item**

In `docusaurus.config.js`, after `CTR`, add:

```js
					{
						type: "docSidebar",
						sidebarId: "debugSidebar",
						position: "left",
						label: "Debug",
					},
```

- [ ] **Step 4: Build and commit**

```bash
bun run build
git add sidebars.js docusaurus.config.js
git commit -m "feat: add debug spec navigation"
```

Expected: build exits 0.

## Task 4: Update CI

**Files:**
- Modify: `.github/workflows/build-deploy.yml`

- [ ] **Step 1: Add output**

In `jobs.check.outputs`, add:

```yaml
      debug_sha: ${{ steps.decide.outputs.debug_sha }}
```

- [ ] **Step 2: Add SHA lookup/stamp/output**

In decide script, add:

```bash
DEBUG_SHA="$(get_sha https://github.com/riscv/riscv-debug-spec.git)"
```

Extend `UPSTREAM_STAMP`:

```bash
;riscv-debug-spec=$DEBUG_SHA
```

Add to output block:

```bash
  echo "debug_sha=$DEBUG_SHA"
```

- [ ] **Step 3: Add checkout step**

After CTR checkout, add:

```yaml
      - name: Checkout riscv-debug-spec
        uses: actions/checkout@v4
        with:
          repository: riscv/riscv-debug-spec
          ref: ${{ needs.check.outputs.debug_sha }}
          path: riscv-debug-spec
          submodules: recursive
```

- [ ] **Step 4: Install Python sympy in CI**

After Ruby gem install or before `Generate MDX docs`, add:

```yaml
      - name: Install Python dependencies
        run: python3 -m pip install --user sympy
```

- [ ] **Step 5: Add generator env var**

In `Generate MDX docs` env, add:

```yaml
          DEBUG_SPEC_DIR: ${{ github.workspace }}/riscv-debug-spec
```

- [ ] **Step 6: Validate and commit**

```bash
python3 - <<'PY'
import yaml
from pathlib import Path
yaml.safe_load(Path('.github/workflows/build-deploy.yml').read_text())
PY
bun run build
git add .github/workflows/build-deploy.yml
git commit -m "ci: build RISC-V debug spec"
```

Expected: YAML parse and build exit 0.

## Task 5: Update docs and ignores

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Add README clone command**

Add:

```bash
git clone --recurse-submodules https://github.com/riscv/riscv-debug-spec ../riscv-debug-spec
```

- [ ] **Step 2: Add README prerequisite note**

In dependencies/generation section, add:

```markdown
The Debug spec generates register definition AsciiDoc files from XML before conversion. This requires Python `sympy`:

```bash
python3 -m pip install --user sympy
```
```

- [ ] **Step 3: Add README env var**

Add:

```markdown
| `DEBUG_SPEC_DIR` | `../riscv-debug-spec` | Path to the RISC-V Debug spec checkout |
```

- [ ] **Step 4: Update README pipeline/generated roots**

Add source root:

```text
riscv-debug-spec/riscv-debug-header.adoc
```

Add generated root `debug` wherever generated doc roots are listed.

- [ ] **Step 5: Update `.gitignore`**

Add:

```gitignore
/static/img/riscv-debug-spec/*
```

- [ ] **Step 6: Build and commit**

```bash
bun run build
git add README.md .gitignore
git commit -m "docs: document RISC-V debug source"
```

Expected: build exits 0 and generated Debug images are ignored.

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
for dir in unprivileged privileged asm-manual sbi iommu trace server-platform control-transfer-records debug; do
  test -f "docs/$dir/sidebar.json"
done
```

Expected: exits 0.

- [ ] **Step 3: Verify Debug source repo clean**

```bash
git -C /home/dmg/projects/riscv-debug-spec status --short
```

Expected: no generated `build/*.adoc` dirt from `gen-mdx.sh`.

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

Expected: CI passes. Note elapsed build time compared with previous run to estimate Debug impact.

## Self-review notes

- Spec coverage: generation, Debug register prep, cleanup, nav/sidebar, CI checkout/stamp/sympy, README/ignore, verification covered.
- Placeholder scan: no deferred implementation placeholders.
- Name consistency: slug `debug`, env `DEBUG_SPEC_DIR`, sidebar `debugSidebar`, label `Debug`.
