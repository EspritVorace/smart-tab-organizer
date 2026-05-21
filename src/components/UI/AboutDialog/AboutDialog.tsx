import React, { useMemo } from 'react';
import { Badge, Button, Dialog, Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowUpRight, Bug } from 'lucide-react';

function GithubMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.5 3.18-1.18 3.18-1.18.63 1.58.23 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.56C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
import { browser } from 'wxt/browser';
import { getMessage } from '@/utils/i18n';
import { DialogCloseButton } from '@/components/UI/DialogShell';
import { ExtensionMark } from './ExtensionMark';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_URL = 'https://github.com/EspritVorace/smart-tab-organizer/tree/main';
const ISSUE_URL = 'https://github.com/EspritVorace/smart-tab-organizer/issues/new';
const CHANGELOG_URL = 'https://github.com/EspritVorace/smart-tab-organizer/releases';
const AUTHOR_URL = 'https://esprit-vorace.fr';

const CREDITS = [
  'WXT',
  'React 19',
  'TypeScript',
  'Radix Themes',
  'Lucide',
  'Zod',
  'Vitest',
  'Playwright',
  'Storybook',
];

function detectBrowserLabel(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (/Firefox\/(\d+)/.test(ua)) {
    const v = /Firefox\/(\d+)/.exec(ua)?.[1] ?? '';
    return `Firefox ${v}`.trim();
  }
  if (/Edg\/(\d+)/.test(ua)) {
    const v = /Edg\/(\d+)/.exec(ua)?.[1] ?? '';
    return `Edge ${v}`.trim();
  }
  if (/OPR\/(\d+)/.test(ua)) {
    const v = /OPR\/(\d+)/.exec(ua)?.[1] ?? '';
    return `Opera ${v}`.trim();
  }
  if (/Chrome\/(\d+)/.test(ua)) {
    const v = /Chrome\/(\d+)/.exec(ua)?.[1] ?? '';
    return `Chrome ${v}`.trim();
  }
  if (/Safari\/(\d+)/.test(ua) && /Version\/(\d+)/.test(ua)) {
    const v = /Version\/(\d+)/.exec(ua)?.[1] ?? '';
    return `Safari ${v}`.trim();
  }
  return '';
}

function detectOsLabel(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  return '';
}

function getUiLanguageLabel(): { name: string; code: string } {
  let code = 'en';
  try {
    code = browser.i18n.getUILanguage();
  } catch {
    code = typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en';
  }
  const short = code.toLowerCase().split(/[-_]/)[0];
  let nameKey: 'aboutDialogLanguageFr' | 'aboutDialogLanguageEn' | 'aboutDialogLanguageEs';
  if (short === 'fr') nameKey = 'aboutDialogLanguageFr';
  else if (short === 'es') nameKey = 'aboutDialogLanguageEs';
  else nameKey = 'aboutDialogLanguageEn';
  return { name: getMessage(nameKey), code: short };
}

interface InfoRowProps {
  label: string;
  value: string;
  hint?: string;
}

function InfoRow({ label, value, hint }: InfoRowProps) {
  return (
    <>
      <Text
        as="div"
        size="1"
        style={{
          color: 'var(--gray-11)',
          fontFamily: 'var(--code-font-family)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {label}
      </Text>
      <Text
        as="div"
        size="1"
        weight="medium"
        style={{
          color: 'var(--gray-12)',
          fontFamily: 'var(--code-font-family)',
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
        {hint && (
          <Text
            as="span"
            size="1"
            style={{
              color: 'var(--gray-11)',
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            {hint}
          </Text>
        )}
      </Text>
    </>
  );
}

interface LinkRowProps {
  href: string;
  title: string;
  hint: string;
  icon: React.ReactNode;
}

function LinkRow({ href, title, hint, icon }: LinkRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="about-dialog-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        margin: '0 -8px',
        borderRadius: 'var(--radius-3)',
        color: 'var(--gray-12)',
        textDecoration: 'none',
      }}
    >
      <span
        className="about-dialog-link__icon"
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-2)',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--gray-a3)',
          color: 'var(--gray-11)',
          flexShrink: 0,
          transition: 'background-color 80ms ease, color 80ms ease',
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
          {title}
        </Text>
        <Text
          size="1"
          style={{
            color: 'var(--gray-11)',
            fontFamily: 'var(--code-font-family)',
            marginTop: 1,
          }}
        >
          {hint}
        </Text>
      </span>
      <ArrowUpRight
        size={14}
        aria-hidden="true"
        style={{ color: 'var(--gray-11)', flexShrink: 0 }}
      />
    </a>
  );
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const version = useMemo(() => {
    try {
      return browser.runtime.getManifest().version;
    } catch {
      return '1.0.0';
    }
  }, []);

  const browserLabel = useMemo(() => detectBrowserLabel(), []);
  const osLabel = useMemo(() => detectOsLabel(), []);
  const { name: languageName, code: languageCode } = useMemo(() => getUiLanguageLabel(), []);

  const sectionStyle: React.CSSProperties = {
    padding: '18px 28px',
    borderTop: '1px solid var(--gray-a4)',
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10.5px',
    fontFamily: 'var(--code-font-family)',
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    color: 'var(--gray-11)',
    fontWeight: 500,
    margin: '0 0 12px',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid="about-dialog"
        maxWidth="540px"
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        <style>{`
          .about-dialog-link:hover {
            background: var(--gray-a3);
          }
          .about-dialog-link:hover .about-dialog-link__icon {
            background: var(--accent-a4);
            color: var(--accent-11);
          }
          .about-dialog-credit-chip {
            font-size: 11.5px;
            padding: 4px 9px;
            border-radius: 5px;
            border: 1px solid var(--gray-a5);
            background: var(--gray-a2);
            color: var(--gray-11);
            font-family: var(--code-font-family);
            transition: color 80ms ease, border-color 80ms ease;
          }
          .about-dialog-credit-chip:hover {
            color: var(--gray-12);
            border-color: var(--gray-a7);
          }
          .about-dialog-author-link:hover {
            color: var(--accent-11);
            text-decoration: underline;
          }
        `}</style>

        <Dialog.Title style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {getMessage('aboutDialogTitle')}
        </Dialog.Title>
        <Dialog.Description style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {getMessage('aboutDialogTagline')}
        </Dialog.Description>

        <DialogCloseButton style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} />

        {/* Header */}
        <Flex align="start" gap="4" style={{ padding: '32px 28px 24px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 6px 18px color-mix(in oklab, var(--accent-9) 35%, transparent)',
            }}
          >
            <ExtensionMark size={56} />
          </div>
          <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
            <Heading
              as="h2"
              size="6"
              weight="medium"
              style={{ letterSpacing: '-0.022em', lineHeight: 1.15, color: 'var(--gray-12)' }}
            >
              {getMessage('aboutDialogTitle')}
            </Heading>
            <Text size="2" style={{ color: 'var(--gray-11)', lineHeight: 1.5, maxWidth: '36ch' }}>
              {getMessage('aboutDialogTagline')}
            </Text>
            <Flex align="center" gap="2" mt="2" wrap="wrap">
              <Badge
                color="indigo"
                variant="soft"
                radius="full"
                data-testid="about-dialog-version-chip"
                style={{
                  fontFamily: 'var(--code-font-family)',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent-9)',
                    boxShadow: '0 0 0 3px color-mix(in oklab, var(--accent-9) 18%, transparent)',
                    marginRight: 6,
                  }}
                />
                {getMessage('aboutDialogVersionChip', [version])}
              </Badge>
            </Flex>
          </Flex>
        </Flex>

        {/* Scroll body */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Information */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{getMessage('aboutDialogSectionInfo')}</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                gap: '8px 18px',
              }}
            >
              <InfoRow
                label={getMessage('aboutDialogInfoVersion')}
                value={version}
              />
              <InfoRow
                label={getMessage('aboutDialogInfoBrowser')}
                value={browserLabel}
                hint={osLabel || undefined}
              />
              <InfoRow
                label={getMessage('aboutDialogInfoLanguage')}
                value={languageName}
                hint={languageCode}
              />
            </div>
          </div>

          {/* Links */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{getMessage('aboutDialogSectionLinks')}</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
              }}
            >
              <LinkRow
                href={SOURCE_URL}
                title={getMessage('aboutDialogLinkSourceTitle')}
                hint={getMessage('aboutDialogLinkSourceHint')}
                icon={<GithubMark size={14} />}
              />
              <LinkRow
                href={ISSUE_URL}
                title={getMessage('aboutDialogLinkIssueTitle')}
                hint={getMessage('aboutDialogLinkIssueHint')}
                icon={<Bug size={14} aria-hidden="true" />}
              />
            </div>
          </div>

          {/* Credits */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{getMessage('aboutDialogSectionCredits')}</h3>
            <Flex wrap="wrap" gap="2">
              {CREDITS.map((c) => (
                <span key={c} className="about-dialog-credit-chip">
                  {c}
                </span>
              ))}
            </Flex>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--gray-a2)',
            borderTop: '1px solid var(--gray-a4)',
          }}
        >
          <Text
            size="1"
            style={{
              color: 'var(--gray-11)',
              fontFamily: 'var(--code-font-family)',
            }}
          >
            {getMessage('aboutDialogFooterMeta')}
            {' · '}
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="about-dialog-link-author"
              className="about-dialog-author-link"
              style={{
                color: 'var(--gray-11)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 80ms ease',
              }}
            >
              {getMessage('aboutDialogFooterAuthor')}
            </a>
          </Text>
          <Flex gap="2">
            <Button
              asChild
              variant="soft"
              color="gray"
              size="2"
              data-testid="about-dialog-btn-changelog"
            >
              <a href={CHANGELOG_URL} target="_blank" rel="noopener noreferrer">
                {getMessage('aboutDialogChangelogButton')}
              </a>
            </Button>
            <Button
              variant="solid"
              size="2"
              data-testid="about-dialog-btn-close"
              data-autofocus="true"
              onClick={() => onOpenChange(false)}
            >
              {getMessage('aboutDialogCloseButton')}
            </Button>
          </Flex>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
