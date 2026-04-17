const apiStyles = {
  title: {
    margin: 0,
    fontSize: '1.75rem',
    lineHeight: 1.2,
    color: '#F8FAFC'
  },
  subtitle: {
    marginTop: '0.8rem',
    color: '#C5D3EA',
    lineHeight: 1.75,
    maxWidth: '72ch'
  },
  placeholder: {
    marginTop: '1.1rem',
    border: '1px dashed #3B4F78',
    borderRadius: '0.85rem',
    padding: '1rem',
    color: '#AFC2E5',
    background: '#101A30'
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
