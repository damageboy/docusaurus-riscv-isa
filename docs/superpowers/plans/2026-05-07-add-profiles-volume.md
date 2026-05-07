# Add Profiles Volume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RISC-V ISA Manual Volume III, Profiles, as a generated Docusaurus docs root at `/docs/profiles`.

**Architecture:** Treat Profiles as a third ISA manual volume from the existing `riscv-isa-manual` checkout. Generate it with the same ISA converter options and image root as Unprivileged and Privileged, then wire a separate Docusaurus sidebar and navbar item.

**Tech Stack:** Bash `gen-mdx.sh`, `asciidoctor-mdx`, Docusaurus sidebars/navbar, Bun build.

---

## Files

- Modify `gen-mdx.sh`: add Profiles wrapper, conversion, copy step.
- Modify `sidebars.js`: import and export Profiles sidebar.
- Modify `docusaurus.config.js`: add Profiles navbar item after Privileged.
- Modify `README.md`: document Profiles source and generated docs root.

Generated files under `docs/profiles/` are gitignored and must not be committed.

---

### Task 1: Generate Profiles MDX

**Files:**
- Modify: `gen-mdx.sh`

- [ ] **Step 1: Add Profiles root variable near existing ISA root variables**

Change the root setup near `UNPRIV_ROOT` and `PRIV_ROOT` to include:

```bash
PROFILES_ROOT="$MANUAL_DIR/src/profiles/profiles.adoc"
```

- [ ] **Step 2: Add Profiles wrapper**

After the privileged wrapper block, add:

```bash
cat >"$WRAP_DIR/profiles.adoc" <<EOF
include::$MANUAL_DIR/src/symbols.adoc[]
include::${PROFILES_ROOT}[]
EOF
```

- [ ] **Step 3: Add Profiles conversion**

After the privileged conversion block and before `Copying ISA docs to Docusaurus`, add:

```bash
echo "Building profiles MDX..."
mkdir -p build/profiles
LANG=C.utf8 "$ASCIIDOCTOR_MDX" \
	"${ISA_MDX_OPTS[@]}" "${MDX_REQUIRES[@]}" \
	-a "imagesdir=$MANUAL_DIR/src/images" \
	-a mdx-sidebar-dir=profiles \
	-D build/profiles \
	"$WRAP_DIR/profiles.adoc"
```

- [ ] **Step 4: Copy Profiles generated docs**

After existing ISA copy lines, add:

```bash
copy_generated_docs "$MANUAL_DIR/build/profiles" "$SCRIPT_DIR/docs/profiles"
```

- [ ] **Step 5: Verify generation**

Run:

```bash
./gen-mdx.sh
test -f docs/profiles/sidebar.json
ls docs/profiles/*.mdx | head
```

Expected:

- `./gen-mdx.sh` exits 0.
- `docs/profiles/sidebar.json` exists.
- `docs/profiles/*.mdx` includes Profiles pages such as `profiles.mdx` or section pages generated from included chapters.

- [ ] **Step 6: Commit Task 1**

```bash
git add gen-mdx.sh
git commit -m "feat: generate RISC-V Profiles volume"
```

---

### Task 2: Wire Profiles navigation

**Files:**
- Modify: `sidebars.js`
- Modify: `docusaurus.config.js`

- [ ] **Step 1: Import Profiles sidebar data**

In `sidebars.js`, add after privileged import:

```js
import profilesData from "./docs/profiles/sidebar.json";
```

- [ ] **Step 2: Export Profiles sidebar**

In `sidebars.js` default export, add after `privilegedSidebar`:

```js
profilesSidebar: withPrefix(profilesData),
```

- [ ] **Step 3: Add navbar item**

In `docusaurus.config.js`, add after the `Privileged` item:

```js
{
	type: "docSidebar",
	sidebarId: "profilesSidebar",
	position: "left",
	label: "Profiles",
},
```

- [ ] **Step 4: Verify navigation build**

Run:

```bash
bun run build
```

Expected: build exits 0.

- [ ] **Step 5: Commit Task 2**

```bash
git add sidebars.js docusaurus.config.js
git commit -m "feat: add Profiles navigation"
```

---

### Task 3: Document Profiles root

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update content pipeline source list**

Change:

```text
riscv-isa-manual/src/{unpriv/unpriv,priv/priv}.adoc
```

to:

```text
riscv-isa-manual/src/{unpriv/unpriv,priv/priv,profiles/profiles}.adoc
```

- [ ] **Step 2: Update generated roots list**

Where README lists generated roots in braces, add `profiles` after `privileged`:

```text
docs/{unprivileged,privileged,profiles,asm-manual,sbi,iommu,trace,server-platform,control-transfer-records,debug,aia}/*.mdx
```

and:

```text
docs/{unprivileged,privileged,profiles,asm-manual,sbi,iommu,trace,server-platform,control-transfer-records,debug,aia}/sidebar.json
```

- [ ] **Step 3: Update prose generated docs list**

Add `docs/profiles/` after `docs/privileged/` in the sentence that lists generated directories.

- [ ] **Step 4: Verify docs-only change**

Run:

```bash
bun run build
```

Expected: build exits 0.

- [ ] **Step 5: Commit Task 3**

```bash
git add README.md
git commit -m "docs: document Profiles volume source"
```

---

### Task 4: Final verification

**Files:**
- No edits expected.

- [ ] **Step 1: Regenerate all docs**

Run:

```bash
./gen-mdx.sh
```

Expected: exits 0.

- [ ] **Step 2: Check Profiles output exists**

Run:

```bash
test -f docs/profiles/sidebar.json
test -n "$(find docs/profiles -maxdepth 1 -name '*.mdx' -print -quit)"
```

Expected: both commands exit 0.

- [ ] **Step 3: Build site**

Run:

```bash
bun run build
```

Expected: exits 0. Existing broken-anchor warnings are non-fatal.

- [ ] **Step 4: Check source repo cleanliness**

Run:

```bash
git -C ../riscv-isa-manual status --short
```

Expected: no tracked modifications. Pre-existing untracked `.pi-lens/` and `.tool-versions` may remain.

- [ ] **Step 5: Check site status**

Run:

```bash
git status --short
```

Expected: clean after commits. Generated `docs/profiles/` should not appear because `docs/` generated roots are ignored.

---

## Self-review

- Spec coverage: generation, sidebar, navbar, docs, CI decision, verification covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type/path consistency: `profiles`, `profilesSidebar`, `docs/profiles`, and `src/profiles/profiles.adoc` used consistently.
