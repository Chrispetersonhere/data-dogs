import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '@data-dogs/ui';

const apiStyles = {
  title: {
    margin: 0,
    fontSize: '1.75rem',
    lineHeight: 1.2,
    color: colorTokens.text.inverse
  },
  subtitle: {
    marginTop: spacingTokens['3'],
    color: '#D4DDEC',
    lineHeight: typographyTokens.lineHeight.relaxed,
    maxWidth: '72ch'
  },
  placeholder: {
    marginTop: spacingTokens['4'],
    border: `1px dashed ${colorTokens.border.default}`,
    borderRadius: radiusTokens.lg,
    padding: spacingTokens['4'],
    color: colorTokens.text.muted,
    background: '#12233F'
  }
};

export default function ApiReferencePage() {
  return (
    <section>
      <h1 style={apiStyles.title}>API Reference</h1>
      <p style={apiStyles.subtitle}>
        Endpoint groups, authentication model, request/response schemas, and provenance guarantees
        will be documented here.
      </p>
      <div style={apiStyles.placeholder}>
        Placeholder: detailed endpoint documentation will be added in subsequent daily scopes.
      </div>
    </section>
  );
}
