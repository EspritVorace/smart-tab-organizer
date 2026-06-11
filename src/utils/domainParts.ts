import { SECOND_LEVEL_PUBLIC_SUFFIXES } from './labelFromDomain';

/**
 * Plain domain shape accepted by the domain filter field: at least two
 * dot-separated labels, no trailing dot. Deliberately mirrors the regex used by
 * `createDomainFilterValidator` (`src/schemas/common.ts`); kept as a local copy
 * so the highlighter never has to import (and risk coupling to) the validator.
 */
const PLAIN_DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;

/** Kind of a highlighted slice of a plain domain. */
export type DomainPartKind = 'subdomain' | 'domain' | 'tld' | 'dot';

/** A character range `[from, to)` of the input string with its semantic role. */
export interface DomainPart {
  from: number;
  to: number;
  kind: DomainPartKind;
}

/**
 * True when `value` is a plain domain the field can colorize: `localhost` or a
 * dotted hostname (`example.com`, `mail.google.com`). Regex-like or otherwise
 * unrecognized values return false so they stay rendered as neutral text.
 */
export function isPlainDomain(value: string): boolean {
  if (value === 'localhost') return true;
  if (value.endsWith('.')) return false;
  return PLAIN_DOMAIN_REGEX.test(value);
}

/**
 * Split a plain domain into colorizable parts (subdomain / domain / tld / dots).
 *
 * Classification is anchored on the END of the hostname: the last label is the
 * extension, unless the last two labels form a known compound public suffix
 * (e.g. `co.uk`) in which case both are the extension. The label immediately
 * before the extension is the domain; anything before that is the subdomain.
 * `localhost` (single label) is treated as a bare domain.
 *
 * Returns an empty array when `value` is not a plain domain, so callers render
 * it as neutral text.
 */
export function splitDomainParts(value: string): DomainPart[] {
  if (!isPlainDomain(value)) return [];

  // Collect label ranges and dot ranges in a single left-to-right pass so the
  // offsets map exactly onto the original string (no trim, no normalization).
  const labels: { from: number; to: number }[] = [];
  const dots: number[] = [];
  let labelStart = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '.') {
      labels.push({ from: labelStart, to: i });
      dots.push(i);
      labelStart = i + 1;
    }
  }
  labels.push({ from: labelStart, to: value.length });

  // Determine how many trailing labels make up the extension.
  let tldCount = 1;
  if (
    labels.length >= 3 &&
    SECOND_LEVEL_PUBLIC_SUFFIXES.has(value.slice(labels[labels.length - 2].from, labels[labels.length - 2].to))
  ) {
    tldCount = 2;
  }

  const tldStartIndex = labels.length - tldCount;
  const domainIndex = tldStartIndex - 1; // -1 when only the extension is present

  const parts: DomainPart[] = labels.map((label, index) => {
    let kind: DomainPartKind;
    // A single-label host (e.g. `localhost`) is the domain, not an extension.
    if (labels.length === 1) kind = 'domain';
    else if (index >= tldStartIndex) kind = 'tld';
    else if (index === domainIndex) kind = 'domain';
    else kind = 'subdomain';
    return { from: label.from, to: label.to, kind };
  });

  for (const at of dots) {
    parts.push({ from: at, to: at + 1, kind: 'dot' });
  }

  // CodeMirror's RangeSetBuilder requires ranges sorted by start offset.
  parts.sort((a, b) => a.from - b.from);
  return parts;
}
