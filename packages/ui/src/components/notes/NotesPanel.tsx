import type { CSSProperties, JSX } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

export type NoteItem = {
  concept: string;
  title: string;
  summary: string;
  taxonomySection: string;
};

type NotesPanelProps = {
  /** Label of the financial line item (shown as the panel heading). */
  lineItemLabel: string;
  /** US-GAAP concept that sourced this line item. */
  conceptUsed: string | null;
  /** Linked note disclosures to display. */
  notes: NoteItem[];
  /** Whether the panel is visible. */
  open: boolean;
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  justifyContent: 'flex-end',
  pointerEvents: 'auto',
};

const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
};

const panelStyle: CSSProperties = {
  position: 'relative',
  width: '380px',
  maxWidth: '90vw',
  height: '100%',
  overflowY: 'auto',
  backgroundColor: colorTokens.surface.card,
  borderLeft: `1px solid ${colorTokens.border.subtle}`,
  boxShadow: shadowTokens.lg,
  display: 'flex',
  flexDirection: 'column',
};

const panelHeaderStyle: CSSProperties = {
  padding: `${spacingTokens['5']} ${spacingTokens['5']} ${spacingTokens['3']}`,
  borderBottom: `1px solid ${colorTokens.border.subtle}`,
};

const panelBodyStyle: CSSProperties = {
  padding: spacingTokens['5'],
  flex: 1,
  overflowY: 'auto',
};

const noteCardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.md,
  padding: spacingTokens['4'],
  marginBottom: spacingTokens['3'],
  backgroundColor: colorTokens.surface.elevated,
};

const noteTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.md,
  fontWeight: typographyTokens.fontWeight.semibold,
  color: colorTokens.text.primary,
};

const noteSummaryStyle: CSSProperties = {
  margin: `${spacingTokens['2']} 0 0`,
  fontSize: typographyTokens.fontSize.sm,
  lineHeight: typographyTokens.lineHeight.relaxed,
  color: colorTokens.text.secondary,
};

const noteMetaStyle: CSSProperties = {
  margin: `${spacingTokens['2']} 0 0`,
  fontSize: typographyTokens.fontSize.xs,
  color: colorTokens.text.muted,
  fontFamily: typographyTokens.fontFamily.mono,
};

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  padding: `${spacingTokens['8']} ${spacingTokens['4']}`,
  color: colorTokens.text.muted,
  fontSize: typographyTokens.fontSize.sm,
};

/**
 * Slide-out panel that displays note/disclosure content linked to a financial
 * line item. Designed to be secondary to the primary financial table — it
 * overlays from the right edge and can be dismissed.
 *
 * Rendered server-side; open/close toggling is handled by the parent page
 * via conditional rendering (no client JS required).
 */
export function NotesPanel({ lineItemLabel, conceptUsed, notes, open }: NotesPanelProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <aside
      role="dialog"
      aria-label={`Notes for ${lineItemLabel}`}
      data-testid="notes-panel"
      style={overlayStyle}
    >
      <div style={backdropStyle} aria-hidden="true" data-testid="notes-panel-backdrop" />
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <p
            style={{
              margin: 0,
              fontSize: typographyTokens.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: colorTokens.text.muted,
            }}
          >
            Note disclosures
          </p>
          <h2
            style={{
              margin: `${spacingTokens['2']} 0 0`,
              fontSize: typographyTokens.fontSize.lg,
              fontWeight: typographyTokens.fontWeight.semibold,
              color: colorTokens.text.primary,
            }}
          >
            {lineItemLabel}
          </h2>
          {conceptUsed && (
            <p
              style={{
                margin: `${spacingTokens['1']} 0 0`,
                fontSize: typographyTokens.fontSize.xs,
                color: colorTokens.text.muted,
                fontFamily: typographyTokens.fontFamily.mono,
              }}
            >
              {conceptUsed}
            </p>
          )}
        </div>
        <div style={panelBodyStyle}>
          {notes.length === 0 ? (
            <div style={emptyStyle} data-testid="notes-panel-empty">
              <p style={{ margin: 0 }}>No linked note disclosures are available for this line item.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.concept} style={noteCardStyle} data-testid="notes-panel-card">
                <h3 style={noteTitleStyle}>{note.title}</h3>
                <p style={noteSummaryStyle}>{note.summary}</p>
                <p style={noteMetaStyle}>
                  ASC {note.taxonomySection} · {note.concept}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
