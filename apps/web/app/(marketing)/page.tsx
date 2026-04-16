import {
  EmptyState,
  FilterChip,
  PageContainer,
  PremiumTableShell,
  SectionHeader,
  StatCard,
  TabStrip,
  colorTokens,
  spacingTokens,
  typographyTokens
} from '@data-dogs/ui';

import styles from './page.module.css';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'risk', label: 'Risk' }
] as const;

const filters = ['All Portfolios', 'Equities', 'Credit', 'Macro'] as const;


const tableCellStyle = {
  padding: `${spacingTokens['3']} ${spacingTokens['5']}`,
  borderTop: `1px solid ${colorTokens.border.subtle}`,
  fontSize: typographyTokens.fontSize.sm,
  color: colorTokens.text.secondary
} as const;

export default function MarketingPage() {
  return (
    <PageContainer>
      <main style={{ display: 'flex', flexDirection: 'column', gap: spacingTokens['10'] }}>
        <section>
          <SectionHeader
            title="Premium Design System Showcase"
            subtitle="Institutional-grade visual primitives for analytics-heavy workflows."
            level={1}
          />
          <p
            style={{
              marginTop: 0,
              maxWidth: '70ch',
              color: colorTokens.text.secondary,
              lineHeight: typographyTokens.lineHeight.relaxed
            }}
          >
            This foundation prioritizes clear hierarchy, conservative color usage, and dependable density control across
            mobile, tablet, and desktop layouts.
          </p>
        </section>

        <section>
          <SectionHeader title="Metric Cards" subtitle="High-signal KPIs with restrained visual emphasis." />
          <div className={styles.statsGrid} style={{ gap: spacingTokens['4'] }}>
            <StatCard label="Net IRR" value="14.2%" delta="+120 bps vs benchmark" />
            <StatCard label="Drawdown" value="-6.8%" delta="Contained within risk policy" />
            <StatCard label="Sharpe Ratio" value="1.34" delta="3Y trailing" />
          </div>
        </section>

        <section>
          <SectionHeader title="Interaction Primitives" subtitle="Tabs and filter chips for segmentation controls." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacingTokens['4'] }}>
            <TabStrip tabs={[...tabs]} activeTabId="overview" />
            <div style={{ display: 'flex', gap: spacingTokens['2'], flexWrap: 'wrap' }}>
              {filters.map((filter, index) => (
                <FilterChip key={filter} label={filter} selected={index === 0} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Premium Table Shell" subtitle="Structured shell for dense tabular intelligence." />
          <PremiumTableShell title="Top Holdings" columns={['Issuer', 'Weight', 'YTD Return', 'Volatility']}>
            <tr>
              <td className={styles.tableCell} style={tableCellStyle}>US Treasury 10Y</td>
              <td className={styles.tableCell} style={tableCellStyle}>18.4%</td>
              <td className={styles.tableCell} style={tableCellStyle}>3.1%</td>
              <td className={styles.tableCell} style={tableCellStyle}>4.8%</td>
            </tr>
            <tr>
              <td className={styles.tableCell} style={tableCellStyle}>Global Equity Value</td>
              <td className={styles.tableCell} style={tableCellStyle}>22.7%</td>
              <td className={styles.tableCell} style={tableCellStyle}>6.4%</td>
              <td className={styles.tableCell} style={tableCellStyle}>9.2%</td>
            </tr>
          </PremiumTableShell>
        </section>

        <section>
          <SectionHeader title="Empty State" subtitle="Fallback presentation with institutional tone." />
          <EmptyState
            title="No custom benchmarks configured"
            description="Add benchmark definitions to compare portfolio attribution, excess return, and risk decomposition."
          />
        </section>
      </main>

    </PageContainer>
  );
}
