// @ts-check
import unprivData from './docs/unprivileged/sidebar.json';
import privData   from './docs/privileged/sidebar.json';

const DOCS_BASE = '/docs';

/**
 * Recursively prepends DOCS_BASE to all `href` fields in sidebar items.
 *
 * Category items whose `link` field has `type: 'link'` are not valid in
 * Docusaurus's sidebar schema (only `doc` and `generated-index` are allowed).
 * We intercept those here: the href is moved into `customProps.href` (with the
 * prefix applied) and the `link` field is removed so Docusaurus validation
 * passes.  The swizzled DocSidebarItemCategory component reads `customProps.href`
 * to render a clickable category header.
 *
 * @param {any[]} items
 * @returns {any[]}
 */
function withPrefix(items) {
  return items.map(item => {
    const out = { ...item };
    if (out.href) out.href = `${DOCS_BASE}/${out.href}`;
    if (out.link?.type === 'link') {
      out.customProps = { ...out.customProps, href: `${DOCS_BASE}/${out.link.href}` };
      delete out.link;
    }
    if (out.items) out.items = withPrefix(out.items);
    return out;
  });
}

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
export default {
  unprivilegedSidebar: withPrefix(unprivData),
  privilegedSidebar:   withPrefix(privData),
};
