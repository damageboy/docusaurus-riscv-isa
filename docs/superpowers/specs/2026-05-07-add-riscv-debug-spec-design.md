# Add RISC-V Debug Specification to Docusaurus site

## Goal

Add `riscv/riscv-debug-spec` as another generated documentation root:

- Source repo: `https://github.com/riscv/riscv-debug-spec`
- URL root: `/docs/debug`
- Navbar label: `Debug`
- Sidebar id: `debugSidebar`

## Approach

Extend the current single Docusaurus docs-plugin pipeline. The debug spec will generate into `docs/debug/` with its own `sidebar.json`, then `sidebars.js` imports the sidebar and `docusaurus.config.js` exposes it in the navbar.

This matches the current roots and keeps search under `/docs`.

## Debug-specific generation requirement

Unlike the other added specs, the Debug spec root `riscv-debug-header.adoc` includes generated register definition files:

```adoc
include::build/abstract_commands-def.adoc[]
include::build/core_registers-def.adoc[]
include::build/dm_registers-def.adoc[]
include::build/hwbp_registers-def.adoc[]
include::build/jtag_registers-def.adoc[]
include::build/sample_registers-def.adoc[]
include::build/sw_registers-def.adoc[]
```

Those files are produced by `make -C build build-registers`, which runs `registers.py`. `registers.py` requires Python `sympy`. Local probing confirmed generation fails without it:

```text
ModuleNotFoundError: No module named 'sympy'
```

## Generation design

Add source directory variable:

| Env var | Default |
|---|---|
| `DEBUG_SPEC_DIR` | `../riscv-debug-spec` |

Add a debug preparation helper in `gen-mdx.sh`:

1. Snapshot/track generated files in `$DEBUG_SPEC_DIR/build/`.
2. Run `make -C "$DEBUG_SPEC_DIR/build" build-registers`.
3. Convert `riscv-debug-header.adoc` through `build_spec_mdx`:
   - slug/build/sidebar: `debug`
   - image URL: `/img/riscv-debug-spec/`
   - image root: `$DEBUG_SPEC_DIR/docs-resources/images`
   - edit URL base: `https://github.com/riscv/riscv-debug-spec/blob/main`
   - attrs: `imagesdir=$DEBUG_SPEC_DIR/docs-resources/images`
4. On exit, remove generated debug build artifacts that did not exist before generation, preserving any pre-existing source checkout state.

Image copying will include:

- `$DEBUG_SPEC_DIR/docs-resources/images` → `static/img/riscv-debug-spec`
- If needed after conversion testing, `$DEBUG_SPEC_DIR/fig` can also be copied or handled with an additional image namespace.

## CI design

Update GitHub Actions:

1. Query `riscv/riscv-debug-spec` HEAD SHA.
2. Add it to `upstream_stamp`.
3. Checkout repo at path `riscv-debug-spec` with recursive submodules.
4. Install Python `sympy` before `./gen-mdx.sh`.
5. Pass `DEBUG_SPEC_DIR` to `gen-mdx.sh`.

Build-time impact should be measured by the GitHub Actions run after push. Local generation should also report whether debug register generation noticeably changes runtime.

## Docusaurus design

- Import `docs/debug/sidebar.json` in `sidebars.js`.
- Export `debugSidebar`.
- Add navbar item `Debug` using `docSidebar`.

## Documentation updates

Update README with:

- Debug spec clone command.
- `DEBUG_SPEC_DIR` env var.
- Python `sympy` prerequisite for Debug register generation.
- Updated pipeline and generated root lists.

Update `.gitignore`:

- Ignore `static/img/riscv-debug-spec/*`.

## Verification

- Install/verify Python `sympy` locally.
- Run `./gen-mdx.sh`.
- Verify `docs/debug/sidebar.json` exists.
- Verify `riscv-debug-spec` sibling repo is not dirtied by generation.
- Run `bun run build`.
- After push, wait for GitHub Actions and note build time impact.
