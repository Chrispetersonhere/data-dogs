import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '@data-dogs/ui';

const pageStyles = {
  hero: { marginBottom: spacingTokens['6'] },
  eyebrow: {
    margin: 0, fontSize: typographyTokens.fontSize.xs, fontWeight: typographyTokens.fontWeight.semibold,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: colorTokens.text.muted
  },
  title: { margin: `${spacingTokens['2']} 0 0`, fontSize: '2rem', lineHeight: 1.15, color: colorTokens.text.primary },
  subtitle: {
    margin: `${spacingTokens['3']} 0 0`, maxWidth: '72ch', fontSize: typographyTokens.fontSize.md,
    lineHeight: typographyTokens.lineHeight.relaxed, color: colorTokens.text.secondary
  },
  grid: { marginTop: spacingTokens['6'], display: 'grid', gap: spacingTokens['4'], gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' },
  card: { border: `1px solid ${colorTokens.border.default}`, borderRadius: radiusTokens.lg, padding: `${spacingTokens['4']} ${spacingTokens['4']} ${spacingTokens['5']}`, background: colorTokens.surface.card },
  cardTitle: { margin: 0, fontSize: typographyTokens.fontSize.md, color: colorTokens.text.primary },
  cardBody: { margin: `${spacingTokens['2']} 0 0`, color: colorTokens.text.secondary, lineHeight: typographyTokens.lineHeight.relaxed, fontSize: typographyTokens.fontSize.sm },
  codeWrap: { marginTop: spacingTokens['5'], border: `1px solid ${colorTokens.border.default}`, borderRadius: radiusTokens.lg, overflow: 'hidden' },
  codeHeader: {
    margin: 0, padding: `${spacingTokens['2']} ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize.xs,
    fontWeight: typographyTokens.fontWeight.semibold, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: colorTokens.text.muted, borderBottom: `1px solid ${colorTokens.border.default}`, background: '#101A32'
  },
  codeBlock: {
    margin: 0, padding: `${spacingTokens['4']} ${spacingTokens['4']}`, background: '#0A1328', color: '#D6E6FF',
    overflowX: 'auto' as const, fontSize: typographyTokens.fontSize.sm, lineHeight: 1.7, fontFamily: typographyTokens.fontFamily.mono
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
        <article style={pageStyles.card}><h2 style={pageStyles.cardTitle}>Navigation-first</h2><p style={pageStyles.cardBody}>The top bar gives consistent access to Overview, API Reference, and Product Docs.</p></article>
        <article style={pageStyles.card}><h2 style={pageStyles.cardTitle}>Readable typography</h2><p style={pageStyles.cardBody}>Spacing, line-height, and contrast are tuned so content remains easy to scan and review.</p></article>
        <article style={pageStyles.card}><h2 style={pageStyles.cardTitle}>Developer-ready code blocks</h2><p style={pageStyles.cardBody}>A dark, high-contrast code block theme supports API examples and integration snippets.</p></article>
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


