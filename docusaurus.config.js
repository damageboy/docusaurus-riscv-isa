// @ts-check
import { themes as prismThemes } from "prism-react-renderer";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGridtables from "@adobe/remark-gridtables";
import {
	TYPE_TABLE,
	mdast2hastGridTablesHandler,
} from "@adobe/mdast-util-gridtables";
// @ts-expect-error remark-kroki-plugin ships CommonJS types but loads as default at runtime.
import remarkKroki from "remark-kroki-plugin";

const krokiOptions = (id) => ({
	krokiBase: "https://kroki.io",
	lang: "kroki",
	langAliases: [
		"actdiag",
		"blockdiag",
		"bpmn",
		"bytefield",
		"c4plantuml",
		"diagramsnet",
		"ditaa",
		"erd",
		"excalidraw",
		"graphviz",
		"nomnoml",
		"nwdiag",
		"packetdiag",
		"pikchr",
		"plantuml",
		"rackdiag",
		"seqdiag",
		"structurizr",
		"svgbob",
		"umlet",
		"vega",
		"vegalite",
		"wavedrom",
	],
	imgRefDir: "/img/" + id + "/kroki",
	imgDir: "static/img/" + id + "/kroki",
	verbose: false,
});

const manualVersion = process.env.MANUAL_VERSION || "";
const manualVersionUrl =
	process.env.MANUAL_VERSION_URL || "https://github.com/riscv/riscv-isa-manual";
const docsExclude = [
	"**/_*.{js,jsx,ts,tsx}",
	"**/_*/**",
	"**/*.test.{js,jsx,ts,tsx}",
	"**/__tests__/**",
];

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "(Unofficial) RISC-V ISA Manual",
	tagline: "The RISC-V Instruction Set Architecture Manual",
	favicon: "img/favicon.svg",

	url: "https://riscv.houmus.org",
	baseUrl: "/",

	onBrokenLinks: "warn",
	onBrokenMarkdownLinks: "warn",

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
		defaultLocale: "en",
		locales: ["en"],
	},

	plugins: ["docusaurus-plugin-image-zoom"],

	presets: [
		[
			"classic",
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					sidebarPath: "./sidebars.js",
					exclude: docsExclude,
					remarkPlugins: [
						remarkMath,
						[remarkKroki, krokiOptions("riscv-isa")],
						remarkGridtables,
					],
					rehypePlugins: [rehypeKatex],
				},
				blog: false,
				theme: {
					customCss: "./src/css/custom.css",
				},
			}),
		],
	],

	themes: /** @type {import('@docusaurus/types').PluginConfig[]} */ ([
		[
			require.resolve("@easyops-cn/docusaurus-search-local"),
			{
				hashed: true,
				language: ["en"],
				docsRouteBasePath: ["docs"],
			},
		],
	]),

	stylesheets: [
		{
			href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
			type: "text/css",
			integrity:
				"sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
			crossorigin: "anonymous",
		},
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			navbar: {
				logo: {
					alt: "RISC-V",
					src: "img/riscv-logo.svg",
					srcDark: "img/riscv-logo.svg",
				},
				title: "RISC-V ISA Manual",
				items: [
					{
						type: "docSidebar",
						sidebarId: "unprivilegedSidebar",
						position: "left",
						label: "Unprivileged",
					},
					{
						type: "docSidebar",
						sidebarId: "privilegedSidebar",
						position: "left",
						label: "Privileged",
					},
					{
						type: "docSidebar",
						sidebarId: "profilesSidebar",
						position: "left",
						label: "Profiles",
					},
					{
						type: "docSidebar",
						sidebarId: "asmManualSidebar",
						position: "left",
						label: "Assembly",
					},
					{
						type: "docSidebar",
						sidebarId: "sbiSidebar",
						position: "left",
						label: "SBI",
					},
					{
						type: "docSidebar",
						sidebarId: "iommuSidebar",
						position: "left",
						label: "IOMMU",
					},
					{
						type: "docSidebar",
						sidebarId: "traceSidebar",
						position: "left",
						label: "Trace",
					},
					{
						type: "docSidebar",
						sidebarId: "serverPlatformSidebar",
						position: "left",
						label: "Server Platform",
					},
					{
						type: "docSidebar",
						sidebarId: "ctrSidebar",
						position: "left",
						label: "CTR",
					},
					{
						type: "docSidebar",
						sidebarId: "debugSidebar",
						position: "left",
						label: "Debug",
					},
					{
						type: "docSidebar",
						sidebarId: "aiaSidebar",
						position: "left",
						label: "AIA",
					},
					...(manualVersion
						? [
								{
									href: manualVersionUrl,
									label: `manual: ${manualVersion}`,
									position: "right",
									className: "navbar-manual-version",
								},
							]
						: []),
					{
						href: "https://github.com/damageboy/docusaurus-riscv-isa",
						position: "right",
						className: "header-github-link",
						"aria-label": "GitHub repository",
					},
				],
			},
			zoom: {
				selector: ".markdown img",
				background: {
					light: "rgb(255, 255, 255)",
					dark: "rgb(50, 50, 50)",
				},
			},
			prism: {
				theme: prismThemes.github,
				darkTheme: prismThemes.dracula,
			},
		}),
};

export default config;
