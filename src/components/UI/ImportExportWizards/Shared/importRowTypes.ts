/**
 * Shared props for import row components (RuleRow, SessionRow).
 * Each row can optionally show a leading checkbox and/or a trailing status badge.
 */
export interface ImportRowBaseProps {
  /** Render a leading checkbox when true. */
  checkbox?: boolean;
  /** Controlled checked state for the leading checkbox. */
  checked?: boolean;
  /** Called when the checkbox value changes. */
  onToggle?: () => void;
  /** When true, renders the row in a dimmed / muted style (used for identical items). */
  dimmed?: boolean;
  /** Text for a trailing status badge (e.g. "identical", "new"). */
  statusBadge?: string;
}
