import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import { splitDomainParts, type DomainPartKind } from '@/utils/domainParts';

/**
 * Mark decoration per domain part. The classes are styled in `cmDomainTheme.ts`
 * with Radix tokens, so colors follow the active accent and appearance.
 */
const DOMAIN_PART_MARK: Record<DomainPartKind, Decoration> = {
  subdomain: Decoration.mark({ class: 'cm-domain-subdomain' }),
  domain: Decoration.mark({ class: 'cm-domain-domain' }),
  tld: Decoration.mark({ class: 'cm-domain-tld' }),
  dot: Decoration.mark({ class: 'cm-domain-dot' }),
};

/** Build the decoration set for the single document line (the domain value). */
function buildDecorations(view: EditorView): DecorationSet {
  const value = view.state.doc.toString();
  const parts = splitDomainParts(value); // [] when not a plain domain -> neutral text
  const builder = new RangeSetBuilder<Decoration>();
  for (const part of parts) {
    builder.add(part.from, part.to, DOMAIN_PART_MARK[part.kind]);
  }
  return builder.finish();
}

/**
 * View plugin that colorizes a plain domain (subdomain / domain / tld / dots)
 * live as it is typed. Regex-like or unrecognized values yield no decorations
 * and stay rendered as neutral text. Single line, so a full rebuild on every
 * document change is cheap.
 */
export const domainHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
