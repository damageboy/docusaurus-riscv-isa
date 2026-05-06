# Add Server Platform and CTR specs to Docusaurus site

## Goal

Add two more RISC-V specification roots to the existing generated Docusaurus site:

- `riscv-non-isa/riscv-server-platform` → `/docs/server-platform`, label `Server Platform`
- `riscv/riscv-control-transfer-records` → `/docs/control-transfer-records`, label `CTR`

Only the main Server Platform spec is included. The Server Platform Test Specification in the same repository is intentionally excluded for now.

## Approach

Use the existing single Docusaurus docs plugin and extend the current `gen-mdx.sh` pipeline. Each new upstream root generates into its own `docs/<slug>/` directory with a generated `sidebar.json`, then `sidebars.js` imports those sidebars and `docusaurus.config.js` exposes them as navbar entries.

This matches the current unprivileged, privileged, Assembly, SBI, IOMMU, and Trace implementation and avoids multiple docs-plugin instances.

## Generation design

Add two source directory variables:

| Env var               | Default                             |
| --------------------- | ----------------------------------- |
| `SERVER_PLATFORM_DIR` | `../riscv-server-platform`          |
| `CTR_DIR`             | `../riscv-control-transfer-records` |

Known source roots:

| Slug                       | Root AsciiDoc                 | Extra handling                                                                  |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `server-platform`          | `server_platform_header.adoc` | `asciidoctor-bibtex`, `server_platform.bib`, `imagesdir=$SERVER_PLATFORM_DIR`   |
| `control-transfer-records` | `header.adoc`                 | `asciidoctor-bibtex`, `example.bib`, `imagesdir=$CTR_DIR/docs-resources/images` |

Image namespaces:

- `/img/riscv-server-platform/`
- `/img/riscv-control-transfer-records/`

Non-ISA build outputs continue to use the existing temp directory behavior so upstream source repos remain clean after generation.

## Docusaurus design

- Import `docs/server-platform/sidebar.json` and `docs/control-transfer-records/sidebar.json` in `sidebars.js`.
- Export sidebar ids `serverPlatformSidebar` and `ctrSidebar`.
- Add navbar entries after existing spec entries:
  - `Server Platform`
  - `CTR`
- Keep local search under `/docs`.

## CI design

Update the build workflow to include two more upstream repositories:

1. Query HEAD SHAs for `riscv-non-isa/riscv-server-platform` and `riscv/riscv-control-transfer-records`.
2. Include those SHAs in `upstream_stamp`.
3. Checkout both repositories with recursive submodules.
4. Pass `SERVER_PLATFORM_DIR` and `CTR_DIR` to `gen-mdx.sh`.
5. Keep writing the combined stamp to `static/built-upstream-shas.txt`.

## Documentation updates

Update README with:

- New source repo clone commands.
- New environment variables.
- Updated content pipeline diagram and generated docs root list.

Update `.gitignore` for new generated image namespaces.

## Verification

- Run `./gen-mdx.sh` with all source repos available.
- Verify sidebars exist for `server-platform` and `control-transfer-records`.
- Run mandatory `bun run build`.
- Confirm current repo and upstream source repos are not dirtied by generation.
