# RISC-V ISA Manual — Docusaurus Site

A searchable, navigable web rendition of the [RISC-V ISA Manual](https://github.com/riscv/riscv-isa-manual), live at **https://riscv.houmus.org**.

## Tech Stack

| Layer | Technology |
|---|---|
| Static site generator | [Docusaurus 3.x](https://docusaurus.io/) (React, v4 compat mode) |
| Package manager / bundler | [Bun](https://bun.sh/) |
| Source format | AsciiDoc (upstream RISC-V ISA repo) |
| AsciiDoc → MDX conversion | [asciidoctor-mdx](https://github.com/damageboy/asciidoctor-mdx) (custom Asciidoctor backend) |
| Math rendering | [remark-math](https://github.com/remarkjs/remark-math) + [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) |
| Diagram rendering | [remark-kroki-plugin](https://github.com/show-docs/remark-kroki-plugin) → [kroki.io](https://kroki.io) |
| Complex tables | [@adobe/remark-gridtables](https://github.com/adobe/remark-gridtables) |
| Local search | [@easyops-cn/docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local) |
| Image zoom | [docusaurus-plugin-image-zoom](https://github.com/flexanalytics/plugin-image-zoom) |
| CI / hosting | GitHub Actions → GitHub Pages |

## Content Pipeline

```
riscv-isa-manual/src/{unpriv,priv/priv}.adoc
    └─ gen-mdx.sh
         ├─ wraps each volume with symbols.adoc (attribute definitions)
         └─ calls asciidoctor-mdx
              │
              ├─ riscv-isa-manual/build/{unpriv,priv}/*.mdx
              ├─ riscv-isa-manual/build/{unpriv,priv}/sidebar.json
              └─ static/img/riscv-isa/          (copied images)
                   └─ kroki/                    (diagram SVG cache)
    └─ Docusaurus build
         └─ build/                              (static site output)
```

The generated MDX files and sidebar JSONs land in `docs/unprivileged/` and `docs/privileged/` (gitignored — never hand-edit them).

## Dependencies

### Upstream source

The manual content comes from [riscv/riscv-isa-manual](https://github.com/riscv/riscv-isa-manual). Clone it as a sibling directory:

```bash
git clone --recurse-submodules https://github.com/riscv/riscv-isa-manual ../riscv-isa-manual
```

The path can be overridden with the `MANUAL_DIR` environment variable.

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

This converts both volumes (unprivileged + privileged), copies images, and writes docs and sidebar JSON into `docs/`.

Environment variables:

| Variable | Default | Description |
|---|---|---|
| `MANUAL_DIR` | `../riscv-isa-manual` | Path to the riscv-isa-manual checkout |
| `ASCIIDOCTOR_MDX` | `~/projects/asciidoctor/wrappers/asciidoctor-mdx` | Path to the asciidoctor-mdx wrapper |

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
