# RISC-V ISA Manual — Docusaurus Site

[![Build & Deploy](https://github.com/damageboy/docusaurus-riscv-isa/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/damageboy/docusaurus-riscv-isa/actions/workflows/build-deploy.yml)

A searchable, navigable web rendition of the [RISC-V ISA Manual](https://github.com/riscv/riscv-isa-manual) plus selected RISC-V non-ISA specifications, live at **https://riscv.houmus.org**.

## Tech Stack

| Layer                     | Technology                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Static site generator     | [Docusaurus 3.x](https://docusaurus.io/) (React, v4 compat mode)                                                                                 |
| Package manager / bundler | [Bun](https://bun.sh/)                                                                                                                           |
| Source format             | AsciiDoc (upstream RISC-V ISA repo)                                                                                                              |
| AsciiDoc → MDX conversion | [asciidoctor-mdx](https://github.com/damageboy/asciidoctor-mdx) (custom Asciidoctor backend)                                                     |
| Math rendering            | [remark-math](https://github.com/remarkjs/remark-math) + [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) |
| Diagram rendering         | [remark-kroki-plugin](https://github.com/show-docs/remark-kroki-plugin) → [kroki.io](https://kroki.io)                                           |
| Complex tables            | [@adobe/remark-gridtables](https://github.com/adobe/remark-gridtables)                                                                           |
| Local search              | [@easyops-cn/docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local)                                                     |
| Image zoom                | [docusaurus-plugin-image-zoom](https://github.com/flexanalytics/plugin-image-zoom)                                                               |
| CI / hosting              | GitHub Actions → GitHub Pages                                                                                                                    |

## Content Pipeline

```text
riscv-isa-manual/src/{unpriv/unpriv,priv/priv}.adoc
riscv-asm-manual/src/riscv-asm.adoc
riscv-sbi-doc/riscv-sbi.adoc
riscv-iommu/src/riscv-iommu.adoc
riscv-trace-spec/header.adoc
riscv-server-platform/server_platform_header.adoc
riscv-control-transfer-records/header.adoc
riscv-debug-spec/riscv-debug-header.adoc
riscv-aia/src/riscv-interrupts.adoc
    └─ gen-mdx.sh
         └─ calls asciidoctor-mdx
              ├─ docs/{unprivileged,privileged,asm-manual,sbi,iommu,trace,server-platform,control-transfer-records,debug,aia}/*.mdx
              ├─ docs/{unprivileged,privileged,asm-manual,sbi,iommu,trace,server-platform,control-transfer-records,debug,aia}/sidebar.json
              └─ static/img/<spec>/
```

The generated MDX files and sidebar JSONs land in `docs/unprivileged/`, `docs/privileged/`, `docs/asm-manual/`, `docs/sbi/`, `docs/iommu/`, `docs/trace/`, `docs/server-platform/`, `docs/control-transfer-records/`, `docs/debug/`, and `docs/aia/` (gitignored — never hand-edit them).

## Dependencies

### Upstream source

The ISA manual content comes from [riscv/riscv-isa-manual](https://github.com/riscv/riscv-isa-manual). Selected non-ISA specs come from sibling RISC-V repositories. Clone them as sibling directories:

```bash
git clone --recurse-submodules https://github.com/riscv/riscv-isa-manual ../riscv-isa-manual
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-asm-manual ../riscv-asm-manual
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-sbi-doc ../riscv-sbi-doc
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-iommu ../riscv-iommu
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-trace-spec ../riscv-trace-spec
git clone --recurse-submodules https://github.com/riscv-non-isa/riscv-server-platform ../riscv-server-platform
git clone --recurse-submodules https://github.com/riscv/riscv-control-transfer-records ../riscv-control-transfer-records
git clone --recurse-submodules https://github.com/riscv/riscv-debug-spec ../riscv-debug-spec
git clone --recurse-submodules https://github.com/riscv/riscv-aia ../riscv-aia
```

The Debug spec generates register definition AsciiDoc files from XML before conversion. This requires Python `sympy`:

```bash
python3 -m pip install --user sympy
```

On externally-managed Python installs, use a virtual environment and put its `bin` first in `PATH` before running `./gen-mdx.sh`.

Paths can be overridden with the environment variables below.

### asciidoctor-mdx

[asciidoctor-mdx](https://github.com/damageboy/asciidoctor-mdx) is a custom Asciidoctor converter backend that emits MDX + Docusaurus sidebar JSON instead of HTML. It handles section numbering, cross-references, math blocks, diagram code blocks, image paths, and bibliography entries.

Install it with:

```bash
gem install asciidoctor asciidoctor-bibtex asciidoctor-lists asciidoctor-sail rouge
git clone https://github.com/damageboy/asciidoctor-mdx
cd asciidoctor-mdx && gem build asciidoctor-mdx.gemspec && gem install asciidoctor-mdx-*.gem
```

The converter is invoked through a thin wrapper script. By default `gen-mdx.sh` looks for it at `~/projects/asciidoctor/wrappers/asciidoctor-mdx`; override with `ASCIIDOCTOR_MDX`.

## Manual Build

### 1. Install JS dependencies

```bash
bun install
```

### 2. Generate MDX from AsciiDoc

```bash
./gen-mdx.sh
```

This converts both ISA volumes and selected non-ISA specs, copies images, and writes docs and sidebar JSON into `docs/`.

Environment variables:

| Variable              | Default                                           | Description                                               |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| `MANUAL_DIR`          | `../riscv-isa-manual`                             | Path to the riscv-isa-manual checkout                     |
| `ASM_MANUAL_DIR`      | `../riscv-asm-manual`                             | Path to the RISC-V assembly manual checkout               |
| `SBI_DOC_DIR`         | `../riscv-sbi-doc`                                | Path to the RISC-V SBI spec checkout                      |
| `IOMMU_DIR`           | `../riscv-iommu`                                  | Path to the RISC-V IOMMU spec checkout                    |
| `TRACE_SPEC_DIR`      | `../riscv-trace-spec`                             | Path to the RISC-V trace spec checkout                    |
| `SERVER_PLATFORM_DIR` | `../riscv-server-platform`                        | Path to the RISC-V Server Platform spec checkout          |
| `CTR_DIR`             | `../riscv-control-transfer-records`               | Path to the RISC-V Control Transfer Records spec checkout |
| `DEBUG_SPEC_DIR`      | `../riscv-debug-spec`                             | Path to the RISC-V Debug spec checkout                    |
| `AIA_DIR`             | `../riscv-aia`                                    | Path to the RISC-V AIA spec checkout                      |
| `ASCIIDOCTOR_MDX`     | `~/projects/asciidoctor/wrappers/asciidoctor-mdx` | Path to the asciidoctor-mdx wrapper                       |

### 3. Build or develop

```bash
bun run build    # production build → build/
bun run start    # dev server with hot reload
bun run serve    # serve the production build locally
bun run clear    # clear Docusaurus cache
```

## Deployment

The site is deployed automatically via GitHub Actions (`.github/workflows/build-deploy.yml`) on every push to `master` and on a daily schedule (to pick up upstream manual changes). Diagrams rendered by kroki.io are cached between runs in the Actions cache.

To trigger a manual redeploy:

```bash
gh workflow run build-deploy.yml
```
