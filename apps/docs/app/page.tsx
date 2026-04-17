const pageStyles = {
  hero: {
    marginBottom: '1.5rem'
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#8FA6CF'
  },
  title: {
    margin: '0.55rem 0 0',
    fontSize: '2rem',
    lineHeight: 1.15,
    color: '#F8FAFC'
  },
  subtitle: {
    margin: '0.85rem 0 0',
    maxWidth: '72ch',
    fontSize: '1rem',
    lineHeight: 1.75,
    color: '#C7D2E6'
  },
  grid: {
    marginTop: '1.5rem',
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
  },
  card: {
    border: '1px solid #263451',
    borderRadius: '0.9rem',
    padding: '1rem 1rem 1.1rem',
    background: 'linear-gradient(180deg, #111A31, #0E172B)'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    color: '#EAF0FD'
  },
  cardBody: {
    margin: '0.6rem 0 0',
    color: '#B9C8E3',
    lineHeight: 1.65,
    fontSize: '0.94rem'
  },
  codeWrap: {
    marginTop: '1.25rem',
    border: '1px solid #2A3B5E',
    borderRadius: '0.85rem',
    overflow: 'hidden'
  },
  codeHeader: {
    margin: 0,
    padding: '0.5rem 0.8rem',
    fontSize: '0.76rem',
    fontWeight: 650,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#A3B5D6',
    borderBottom: '1px solid #2A3B5E',
    background: '#101A32'
  },
  codeBlock: {
    margin: 0,
    padding: '1rem 1.1rem',
    background: '#0A1328',
    color: '#D6E6FF',
    overflowX: 'auto' as const,
    fontSize: '0.86rem',
    lineHeight: 1.7,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace"
  }
};

export default function DocsHomePage() {
  return (
    <section>
      <header style={pageStyles.hero}>
        <p style={pageStyles.eyebrow}>Data Dogs · Docs</p>
        <h1 style={pageStyles.title}>Clean, reliable docs for production workflows.</h1>
        <p style={pageStyles.subtitle}>
          This shell introduces a premium documentation surface aligned with the Data Dogs brand:
          concise navigation, human-readable typography, and a code theme designed for long sessions.
        </p>
      </header>

      <div style={pageStyles.grid}>
        <article style={pageStyles.card}>
          <h2 style={pageStyles.cardTitle}>Navigation-first</h2>
          <p style={pageStyles.cardBody}>
            The top bar gives consistent access to Overview, API Reference, and Product Docs.
          </p>
        </article>
        <article style={pageStyles.card}>
          <h2 style={pageStyles.cardTitle}>Readable typography</h2>
          <p style={pageStyles.cardBody}>
            Spacing, line-height, and contrast are tuned so content remains easy to scan and review.
          </p>
        </article>
        <article style={pageStyles.card}>
          <h2 style={pageStyles.cardTitle}>Developer-ready code blocks</h2>
          <p style={pageStyles.cardBody}>
            A dark, high-contrast code block theme supports API examples and integration snippets.
          </p>
        </article>
      </div>

      <div style={pageStyles.codeWrap}>
        <p style={pageStyles.codeHeader}>Quick start example</p>
        <pre style={pageStyles.codeBlock}>{`curl -sS "https://api.data-dogs.dev/v1/filings?ticker=AAPL&limit=3" \\
  -H "Authorization: Bearer <token>" \\
  -H "Accept: application/json"`}</pre>
      </div>
    </section>
  );
}
