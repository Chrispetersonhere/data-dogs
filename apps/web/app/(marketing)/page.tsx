import { PageContainer, SectionHeader } from '../../../../packages/ui/src/components/layout';
import {
  EmptyState,
  FilterChip,
  PremiumTableShell,
  StatCard,
  TabStrip
} from '../../../../packages/ui/src/components/ui';
import { colorTokens, spacingTokens, typographyTokens } from '../../../../packages/ui/src/styles/tokens';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'risk', label: 'Risk' }
] as const;

const filters = ['All Portfolios', 'Equities', 'Credit', 'Macro'] as const;

export default function MarketingPage() {
  return (
    <PageContainer>
      <main style={{ display: 'flex', flexDirection: 'column', gap: spacingTokens['10'] }}>
        <section>
          <SectionHeader
            title="Premium Design System Showcase"
            subtitle="Institutional-grade visual primitives for analytics-heavy workflows."
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
          <div className="stats-grid">
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
              <td className="table-cell">US Treasury 10Y</td>
              <td className="table-cell">18.4%</td>
              <td className="table-cell">3.1%</td>
              <td className="table-cell">4.8%</td>
            </tr>
            <tr>
              <td className="table-cell">Global Equity Value</td>
              <td className="table-cell">22.7%</td>
              <td className="table-cell">6.4%</td>
              <td className="table-cell">9.2%</td>
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

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: ${spacingTokens['4']};
        }

        .table-cell {
          padding: ${spacingTokens['3']} ${spacingTokens['5']};
          border-top: 1px solid ${colorTokens.border.subtle};
          font-size: ${typographyTokens.fontSize.sm};
          color: ${colorTokens.text.secondary};
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </PageContainer>
  );
}
