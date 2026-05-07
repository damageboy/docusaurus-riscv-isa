# Add RISC-V AIA Specification to Docusaurus site

## Goal

Add `riscv/riscv-aia` as another generated documentation root:

- Source repo: `https://github.com/riscv/riscv-aia`
- URL root: `/docs/aia`
- Navbar label: `AIA`
- Sidebar id: `aiaSidebar`

## Approach

Extend the existing single Docusaurus docs-plugin pipeline. The AIA spec will generate into `docs/aia/` with its own `sidebar.json`, then `sidebars.js` imports the sidebar and `docusaurus.config.js` exposes it in the navbar.

This matches all current roots and keeps search under `/docs`.

## Source analysis

The AIA repo has a Makefile with:

- `DOCS := riscv-interrupts.adoc`
- `SRC_DIR := src`
- `HEADER_SOURCE := ${SRC_DIR}/riscv-interrupts.adoc`

The main root is therefore:

```text
src/riscv-interrupts.adoc
```

A second file, `src/riscv-duoplic.adoc`, exists but is not the Makefile target. It is intentionally excluded for now.

Image references in source use bare names such as:

```adoc
image::AdvPLIC-ex-1Domain.png[]
image::IOMMU-guestIntrFiles.png[]
```

Local probing showed those content images live next to the AsciiDoc files under `src/`, not under `docs-resources/images`. Generation should pass `imagesdir=$AIA_DIR/src` and copy source PNGs from `src/` to `static/img/riscv-aia/`. `docs-resources/images` only holds shared logo assets.

## Generation design

Add source directory variable:

| Env var | Default |
|---|---|
| `AIA_DIR` | `../riscv-aia` |

Add a `build_spec_mdx` call:

- repo: `$AIA_DIR`
- root doc: `src/riscv-interrupts.adoc`
- build/docs/sidebar slug: `aia`
- image URL: `/img/riscv-aia/`
- image root: `$AIA_DIR/src`
- edit URL base: `https://github.com/riscv/riscv-aia/blob/main`
- attrs: `imagesdir=$AIA_DIR/src`

No pre-generation helper like Debug’s register generation is expected.

## CI design

Update GitHub Actions:

1. Query `riscv/riscv-aia` HEAD SHA.
2. Add it to `upstream_stamp`.
3. Checkout repo at path `riscv-aia` with recursive submodules.
4. Pass `AIA_DIR` to `gen-mdx.sh`.

## Docusaurus design

- Import `docs/aia/sidebar.json` in `sidebars.js`.
- Export `aiaSidebar`.
- Add navbar item `AIA` using `docSidebar`.

## Documentation updates

Update README with:

- AIA clone command.
- `AIA_DIR` env var.
- Updated pipeline and generated root lists.

Update `.gitignore`:

- Ignore `static/img/riscv-aia/*`.

## Verification

- Run `./gen-mdx.sh`.
- Verify `docs/aia/sidebar.json` exists.
- Verify `riscv-aia` sibling repo is not dirtied by generation.
- Run `bun run build`.
- After push, wait for GitHub Actions and note build time impact.
