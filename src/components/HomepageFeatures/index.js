import clsx from "clsx";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import { searchBarShortcutKeymap } from "@generated/@easyops-cn/docusaurus-search-local/default/generated";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

function isMacPlatform() {
	return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

function getShortcutKeys(keymap, isMac) {
	return keymap.split("+").map((key) => {
		const normalized = key.trim().toLowerCase();
		if (normalized === "mod") return isMac ? "⌘" : "Ctrl";
		if (normalized === "cmd") return isMac ? "⌘" : "Cmd";
		if (normalized === "ctrl") return "Ctrl";
		if (normalized === "alt") return isMac ? "⌥" : "Alt";
		if (normalized === "shift") return isMac ? "⇧" : "Shift";
		return normalized.toUpperCase();
	});
}

function SearchShortcut() {
	return (
		<BrowserOnly
			fallback={getShortcutKeys(searchBarShortcutKeymap, false).map((key) => (
				<kbd key={key}>{key}</kbd>
			))}
		>
			{() =>
				getShortcutKeys(searchBarShortcutKeymap, isMacPlatform()).map((key) => (
					<kbd key={key}>{key}</kbd>
				))
			}
		</BrowserOnly>
	);
}

const FeatureList = [
	{
		title: "Generated Specifications",
		description: (
			<>
				<p>
					This is an <strong>unofficial</strong> rendering of RISC-V
					specifications. The authoritative sources are the official upstream
					repositories.
				</p>
				<h4>RISC-V ISA Manual</h4>
				<ul className={styles.docList}>
					<li>
						<Link to="/docs/unprivileged/introduction">Unprivileged ISA</Link>
					</li>
					<li>
						<Link to="/docs/privileged/introduction">
							Privileged Architecture
						</Link>
					</li>
					<li>
						<Link to="/docs/profiles/introduction">Profiles</Link>
					</li>
				</ul>
				<h4>Other generated specs</h4>
				<ul className={styles.docList}>
					<li>
						<Link to="/docs/asm-manual/scope">
							Assembly Programmer's Manual
						</Link>
					</li>
					<li>
						<Link to="/docs/sbi/introduction">Supervisor Binary Interface</Link>
					</li>
					<li>
						<Link to="/docs/iommu/introduction">IOMMU</Link>
					</li>
					<li>
						<Link to="/docs/trace/sec-intro">Processor Trace</Link>
					</li>
					<li>
						<Link to="/docs/server-platform/intro">Server Platform</Link>
					</li>
					<li>
						<Link to="/docs/control-transfer-records/intro">
							Control Transfer Records
						</Link>
					</li>
					<li>
						<Link to="/docs/debug/intro">External Debug Support</Link>
					</li>
					<li>
						<Link to="/docs/aia/ch-intro">Advanced Interrupt Architecture</Link>
					</li>
				</ul>
			</>
		),
	},
	{
		title: "Full-Text Search",
		description: (
			<>
				Every generated spec is indexed and searchable. Press <SearchShortcut />{" "}
				or click the search bar to find any instruction, CSR, register, or
				concept instantly.
			</>
		),
	},
	{
		title: "Zoomable Diagrams",
		description: (
			<>
				Instruction encodings, timing diagrams, and state machine figures can be
				clicked to zoom in, making it easy to read dense register-layout
				diagrams on any screen size.
			</>
		),
	},
];

function Feature({ title, description }) {
	return (
		<div className={clsx("col col--4")}>
			<div className="text--center padding-horiz--md padding-vert--md">
				<Heading as="h3">{title}</Heading>
				<div className={styles.featureDescription}>{description}</div>
			</div>
		</div>
	);
}

export default function HomepageFeatures() {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}
