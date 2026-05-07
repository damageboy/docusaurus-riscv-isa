# Add RISC-V Profiles Volume Design

## Goal

Add RISC-V ISA Manual Volume III, Profiles, as a first-class Docusaurus docs root.

## Source

Use the existing `riscv-isa-manual` checkout. The root AsciiDoc source is:

```text
../riscv-isa-manual/src/profiles/profiles.adoc
```

It includes:

- `preface.adoc`
- `intro.adoc`
- `rvi20.adoc`
- `rva20.adoc`
- `rva22.adoc`
- `rva23.adoc`
- `rvb23.adoc`

## URL and navigation

Generate docs under:

```text
docs/profiles/
```

Expose the docs at:

```text
/docs/profiles
```

Add navbar item:

```text
Profiles
```

Place it immediately after `Privileged` and before `Assembly`.

## Generation

Treat Profiles as an ISA manual volume, not as a separate non-ISA repository.

`gen-mdx.sh` will:

1. Create a wrapper AsciiDoc file that includes `src/symbols.adoc` first.
2. Include `src/profiles/profiles.adoc` from that wrapper.
3. Run `asciidoctor-mdx` with the same ISA options used for Unprivileged and Privileged:
   - `bibtex-file=$MANUAL_DIR/src/resources/riscv-spec.bib`
   - `github-edit-url-base=https://github.com/riscv/riscv-isa-manual/blob/main`
   - `github-local-root=$MANUAL_DIR`
   - `mdx-images-url=/img/riscv-isa/`
   - `mdx-images-root=$MANUAL_DIR/src/images`
   - shared ISA converter requires
4. Write intermediate output to `riscv-isa-manual/build/profiles`.
5. Copy generated `.mdx` files and `sidebar.json` to `docs/profiles`.

## Sidebars

`sidebars.js` will:

- import `./docs/profiles/sidebar.json`
- expose `profilesSidebar: withPrefix(profilesData)`

This keeps Profiles independent from Unprivileged and Privileged while using the same single Docusaurus docs plugin.

## CI

No new checkout is required. Profiles comes from the already checked-out `riscv-isa-manual` repository.

No new upstream stamp entry is required. Existing `riscv-isa-manual=<sha>` covers Profiles.

## Documentation

Update `README.md` to mention:

- source root `riscv-isa-manual/src/profiles/profiles.adoc`
- generated root `docs/profiles`

No new environment variable is needed.

## Verification

Run:

```bash
./gen-mdx.sh
test -f docs/profiles/sidebar.json
bun run build
git status --short
git -C ../riscv-isa-manual status --short
```

Expected:

- Profiles MDX files generated under `docs/profiles`.
- Build exits 0.
- Site repository has only intentional tracked edits before commit.
- `../riscv-isa-manual` remains unchanged except pre-existing local untracked files.
