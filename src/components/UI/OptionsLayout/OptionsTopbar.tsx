import { useMemo } from 'react';
import { Flex, IconButton, Link, Text, Tooltip } from '@radix-ui/themes';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/UI/ThemeToggle/ThemeToggle';
import { getDocsUrl } from '@/utils/docsUrl';
import { getMessage } from '@/utils/i18n';

interface OptionsTopbarProps {
  pageTitle: string;
  /** When set, the topbar renders a second crumb after pageTitle. */
  pageSubtitle?: string;
  /** href to attach to the parent crumb (`pageTitle`) when a subtitle is shown.
   *  Makes the parent crumb a clickable link back to the parent route. */
  parentHref?: string;
}

export function OptionsTopbar({ pageTitle, pageSubtitle, parentHref }: OptionsTopbarProps) {
  const docsUrl = useMemo(() => getDocsUrl(), []);
  const parentCrumbStyle = { color: 'var(--gray-12)', letterSpacing: '-0.005em' };
  const parentIsLink = Boolean(pageSubtitle && parentHref);

  return (
    <Flex
      asChild
      align="center"
      justify="between"
      px="4"
    >
      <header
        data-testid="options-topbar"
        aria-label={getMessage('extensionName')}
        style={{
          height: '52px',
          flexShrink: 0,
          background: 'color-mix(in oklab, var(--color-background) 85%, transparent)',
          backdropFilter: 'saturate(180%) blur(12px)',
          WebkitBackdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: '1px solid var(--gray-a4)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <Flex align="center" gap="2">
          <Text
            size="2"
            style={{
              color: 'var(--gray-11)',
              fontFamily: 'var(--code-font-family)',
              letterSpacing: '0.02em',
            }}
          >
            SmartTab Organizer
          </Text>
          <Text size="2" style={{ color: 'var(--gray-9)' }} aria-hidden="true">
            /
          </Text>
          {parentIsLink ? (
            <Link
              size="2"
              weight="medium"
              href={parentHref}
              data-testid="topbar-page-title"
              style={parentCrumbStyle}
            >
              {pageTitle}
            </Link>
          ) : (
            <Text
              size="2"
              weight="medium"
              data-testid="topbar-page-title"
              style={parentCrumbStyle}
            >
              {pageTitle}
            </Text>
          )}
          {pageSubtitle && (
            <>
              <Text size="2" style={{ color: 'var(--gray-9)' }} aria-hidden="true">
                /
              </Text>
              <Text
                size="2"
                weight="medium"
                data-testid="topbar-page-subtitle"
                style={{ color: 'var(--gray-12)', letterSpacing: '-0.005em' }}
              >
                {pageSubtitle}
              </Text>
            </>
          )}
        </Flex>
        <Flex align="center" gap="1">
          <ThemeToggle />
          <Tooltip content={getMessage('topbarDocumentationLinkAria')}>
            <IconButton
              asChild
              variant="ghost"
              size="2"
              style={{ color: 'var(--gray-11)' }}
            >
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="topbar-help"
                aria-label={getMessage('topbarDocumentationLinkAria')}
              >
                <BookOpen size={16} aria-hidden="true" />
              </a>
            </IconButton>
          </Tooltip>
        </Flex>
      </header>
    </Flex>
  );
}
