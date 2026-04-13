import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Unofficial Web Rendering',
    description: (
      <>
        This is an <strong>unofficial</strong> rendering of the{' '}
        <a href="https://github.com/riscv/riscv-isa-manual">RISC-V ISA Manual</a>.
        The authoritative source is the official RISC-V specification.
        <br /><br />
        <strong>Volume I</strong> — Unprivileged ISA ✓<br />
        <strong>Volume II</strong> — Privileged Architecture ✓<br />
        <strong>Volume III</strong> — Profiles &amp; Platforms — <em>not yet ported</em>
      </>
    ),
  },
  {
    title: 'Full-Text Search',
    description: (
      <>
        Every section of the Unprivileged and Privileged specs is indexed and
        searchable. Press <kbd>/</kbd> or click the search bar to find any
        instruction, CSR, or concept instantly.
      </>
    ),
  },
  {
    title: 'Zoomable Diagrams',
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
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
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
