import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type TabOption = {
  id: string;
  label: string;
};

type TabStripProps = {
  tabs: TabOption[];
  activeTabId: string;
};

export function TabStrip({ tabs, activeTabId }: TabStripProps) {
  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      style={{
        display: 'inline-flex',
        gap: spacingTokens['2'],
        borderBottom: `1px solid ${colorTokens.border.subtle}`,
        width: '100%',
        overflowX: 'auto'
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            style={{
              border: 'none',
              borderBottom: `2px solid ${isActive ? colorTokens.text.primary : 'transparent'}`,
              backgroundColor: 'transparent',
              color: isActive ? colorTokens.text.primary : colorTokens.text.muted,
              fontSize: typographyTokens.fontSize.sm,
              fontWeight: isActive ? typographyTokens.fontWeight.semibold : typographyTokens.fontWeight.medium,
              borderRadius: `${radiusTokens.sm} ${radiusTokens.sm} 0 0`,
              padding: `${spacingTokens['3']} ${spacingTokens['4']}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
