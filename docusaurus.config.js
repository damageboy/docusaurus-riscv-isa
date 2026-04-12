// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGridtables from '@adobe/remark-gridtables';
import { TYPE_TABLE, mdast2hastGridTablesHandler } from '@adobe/mdast-util-gridtables';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const remarkKroki = require('remark-kroki-plugin');

const krokiOptions = (id) => ({
  krokiBase: 'https://kroki.io',
  lang: 'kroki',
  langAliases: [
    'actdiag', 'blockdiag', 'bpmn', 'bytefield', 'c4plantuml',
    'diagramsnet', 'ditaa', 'erd', 'excalidraw', 'graphviz',
    'nomnoml', 'nwdiag', 'packetdiag', 'pikchr', 'plantuml',
    'rackdiag', 'seqdiag', 'structurizr', 'svgbob', 'umlet',
    'vega', 'vegalite', 'wavedrom',
  ],
  imgRefDir: '/img/' + id + '/kroki',
  imgDir: 'static/img/' + id + '/kroki',
  verbose: false,
});

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'RISC-V ISA Manual',
  tagline: 'The RISC-V Instruction Set Architecture Manual',
  favicon: 'img/favicon.ico',

  url: 'https://riscv.org',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

   future: {
    v4: true, // opt-in for Docusaurus v4 planned changes
    faster: true, // turns Docusaurus Faster on globally
  },

  markdown: {
    // {#id} heading syntax requires this when future.v4 is enabled
    mdx1Compat: { headingIds: true },
    remarkRehypeOptions: {
      handlers: {
        [TYPE_TABLE]: mdast2hastGridTablesHandler(),
      },
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          remarkPlugins: [remarkMath, [remarkKroki, krokiOptions('riscv-isa')], remarkGridtables],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en'],
        docsRouteBasePath: ['docs'],
      }),
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        logo: {
          alt: 'RISC-V',
          src: 'img/riscv-logo.svg',
          srcDark: 'img/riscv-logo.svg',
        },
        title: 'RISC-V ISA Manual',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'unprivilegedSidebar',
            position: 'left',
            label: 'Unprivileged',
          },
          {
            type: 'docSidebar',
            sidebarId: 'privilegedSidebar',
            position: 'left',
            label: 'Privileged',
          },
        ],
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
