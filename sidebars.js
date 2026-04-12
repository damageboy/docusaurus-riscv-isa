// @ts-check
import unprivData from './docs/unprivileged/sidebar.json';
import privData   from './docs/privileged/sidebar.json';

const DOCS_BASE = '/docs';

/**
 * Recursively prepends DOCS_BASE to all `href` fields in sidebar items.
 * Category `link` objects use Docusaurus doc IDs (not URLs) and are left untouched.
 * @param {any[]} items
 * @returns {any[]}
 */
function withPrefix(items) {
  return items.map(item => {
    const out = { ...item };
    if (out.href) out.href = `${DOCS_BASE}/${out.href}`;
    if (out.items) out.items = withPrefix(out.items);
    return out;
  });
}

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
export default {
  unprivilegedSidebar: withPrefix(unprivData),
  privilegedSidebar:   withPrefix(privData),
};
