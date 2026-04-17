import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '@data-dogs/ui';

const productStyles = {
  title: { margin: 0, fontSize: '1.75rem', lineHeight: 1.2, color: colorTokens.text.primary },
  subtitle: { marginTop: spacingTokens['3'], color: colorTokens.text.secondary, lineHeight: typographyTokens.lineHeight.relaxed, maxWidth: '72ch' },
  placeholder: { marginTop: spacingTokens['4'], border: `1px dashed ${colorTokens.border.default}`, borderRadius: radiusTokens.lg, padding: spacingTokens['4'], color: colorTokens.text.tertiary, background: colorTokens.surface.card }
};

export default function ProductDocsPage() {
  return (
    <section>
      <h1 style={productStyles.title}>Product Documentation</h1>
      <p style={productStyles.subtitle}>Concepts, user workflows, and operating principles for the Data Dogs platform will live here.</p>
      <div style={productStyles.placeholder}>Placeholder: product guides and architecture narratives are planned for upcoming increments.</div>
    </section>
  );
}

