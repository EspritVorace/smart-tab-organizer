import {
  StreamLanguage,
  HighlightStyle,
  type StreamParser,
  type StringStream,
} from '@codemirror/language';
import { tags as t, type Tag } from '@lezer/highlight';

/**
 * Token names emitted by the single-line regex tokenizer. Each maps to a
 * `@lezer/highlight` tag through {@link regexTokenTable} so the colors flow
 * through the standard `syntaxHighlighting(HighlightStyle)` path, exactly like
 * the JSON editor (`cmTheme.ts`).
 */
interface RegexParserState {
  /** Inside a `[...]` character class: most metacharacters become literals. */
  inClass: boolean;
}

/** Tokenize one character while inside a `[...]` class (only `\` and `]` matter). */
function tokenInClass(stream: StringStream, state: RegexParserState, ch: string): string {
  if (ch === '\\') {
    stream.next(); // consume the escaped character
    return 'escapeLiteral';
  }
  if (ch === ']') {
    state.inClass = false;
    return 'classBracket';
  }
  return 'classContent';
}

/** Tokenize an escape sequence: `\d \w \s \b`, backreferences, literals. */
function tokenEscape(stream: StringStream): string {
  const next = stream.next();
  if (next == null) return 'invalid'; // dangling backslash
  if (/[dDwWsSbBAZ]/.test(next)) return 'escapeClass';
  if (/[1-9]/.test(next)) return 'backref';
  if (next === 'k' && stream.peek() === '<') {
    stream.match(/^<[^>]*>/); // named backreference \k<name>
    return 'backref';
  }
  return 'escapeLiteral';
}

/** Tokenize a group opening, consuming any non-capturing / lookaround / named prefix. */
function tokenGroupOpen(stream: StringStream): string {
  if (stream.peek() !== '?') return 'group';
  stream.next(); // '?'
  const p = stream.peek();
  if (p === '<') {
    stream.next(); // '<'
    const after = stream.peek();
    if (after === '=' || after === '!') {
      stream.next(); // lookbehind (?<= / (?<!
      return 'group';
    }
    stream.match(/^[^>]*>/); // named group (?<name>
    return 'groupName';
  }
  if (p === ':' || p === '=' || p === '!') stream.next();
  return 'group';
}

/** Tokenize a quantifier: `* + ?`, lazy variants, and counted `{n,m}`. */
function tokenQuantifier(stream: StringStream, ch: string): string | null {
  if (ch === '*' || ch === '+' || ch === '?') {
    stream.eat('?'); // lazy modifier
    return 'quantifier';
  }
  // ch === '{'
  if (stream.match(/^\d+(,\d*)?\}/)) {
    stream.eat('?');
    return 'count';
  }
  return null; // literal brace
}

/**
 * Minimal regular-expression tokenizer for a single-line field. It is not a
 * full grammar: it recognises the common JavaScript regex constructs (groups,
 * character classes, quantifiers, anchors, alternation, escapes,
 * backreferences) so the user gets live visual feedback while typing a pattern.
 */
const regexParser: StreamParser<RegexParserState> = {
  name: 'regex',
  startState: () => ({ inClass: false }),
  token(stream, state) {
    const ch = stream.next();
    if (ch == null) return null;

    if (state.inClass) return tokenInClass(stream, state, ch);
    if (ch === '\\') return tokenEscape(stream);
    if (ch === '[') {
      state.inClass = true;
      stream.eat('^'); // optional negation
      return 'classBracket';
    }
    if (ch === '(') return tokenGroupOpen(stream);
    if (ch === ')') return 'group';
    if (ch === '^' || ch === '$') return 'anchor';
    if (ch === '.') return 'dot';
    if (ch === '|') return 'alternation';
    if (ch === '*' || ch === '+' || ch === '?' || ch === '{') {
      return tokenQuantifier(stream, ch);
    }
    return null; // literal character (inherits the editor text color)
  },
  tokenTable: {
    group: t.paren,
    groupName: t.propertyName,
    classBracket: t.squareBracket,
    classContent: t.string,
    quantifier: t.operator,
    count: t.number,
    anchor: t.keyword,
    dot: t.keyword,
    alternation: t.operator,
    escapeClass: t.escape,
    escapeLiteral: t.escape,
    backref: t.special(t.variableName),
    invalid: t.invalid,
  } satisfies Record<string, Tag>,
};

/** CodeMirror language extension highlighting a single-line regex pattern. */
export const regexLanguage = StreamLanguage.define(regexParser);

/**
 * Token colors mapped onto Radix scale variables so the field follows the
 * active accent and flips automatically between light and dark appearances
 * (mirrors `jsonHighlightStyle` in the JSON editor).
 */
export const regexHighlightStyle = HighlightStyle.define([
  { tag: [t.paren, t.propertyName], color: 'var(--accent-11)' }, // groups, named groups
  { tag: t.squareBracket, color: 'var(--iris-11)' }, // character class brackets
  { tag: t.string, color: 'var(--gray-12)' }, // character class contents
  { tag: [t.operator, t.number], color: 'var(--amber-11)' }, // quantifiers, alternation, counts
  { tag: t.keyword, color: 'var(--purple-11)' }, // anchors, dot
  { tag: t.escape, color: 'var(--grass-11)' }, // \d \w escapes and literals
  { tag: t.variableName, color: 'var(--cyan-11)' }, // backreferences
  { tag: t.invalid, color: 'var(--red-11)' }, // dangling escapes
]);
