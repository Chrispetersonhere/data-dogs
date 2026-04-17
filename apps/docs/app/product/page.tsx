const productStyles = {
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

export default function ProductDocsPage() {
  return (
    <section>
      <h1 style={productStyles.title}>Product Documentation</h1>
      <p style={productStyles.subtitle}>
        Concepts, user workflows, and operating principles for the Data Dogs platform will live here.
      </p>
      <div style={productStyles.placeholder}>
        Placeholder: product guides and architecture narratives are planned for upcoming increments.
      </div>
    </section>
  );
}
