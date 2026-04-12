import React from 'react';
import OriginalDocSidebarItemCategory from '@theme-original/DocSidebarItem/Category';

/**
 * Swizzle wrapper for DocSidebarItemCategory.
 *
 * Docusaurus's sidebar schema only allows `link: { type: 'doc' }` or
 * `link: { type: 'generated-index' }` on categories — not plain href links.
 * To work around this, the sidebar generation stores the desired href in
 * `customProps.href`.  This wrapper injects it as `item.href` so the original
 * component renders a clickable category header (with a separate collapse
 * button) rather than a non-clickable toggle.
 */
export default function DocSidebarItemCategory({ item, ...props }) {
  const enhancedItem =
    item.customProps?.href ? { ...item, href: item.customProps.href } : item;
  return <OriginalDocSidebarItemCategory item={enhancedItem} {...props} />;
}
