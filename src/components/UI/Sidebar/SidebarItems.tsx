import { useEffect, useRef, useState } from 'react';
import { Flex, Text, Button, Box, Badge, Separator } from '@radix-ui/themes';
import { SidebarItem, SidebarSection } from './Sidebar';
import { useListNavigation } from '@/hooks/useListNavigation';

const ICON_SIZE = 16;
const ICON_STROKE = 1.75;

type BadgeColor = React.ComponentProps<typeof Badge>['color'];

interface SidebarItemsProps {
  isCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onItemPreload?: (itemId: string) => void;
  sections: SidebarSection[];
}

interface AccentTokens {
  background: string;
  text: string;
  border: string;
}

function resolveAccentTokens(accentColor: string | undefined): AccentTokens {
  if (accentColor) {
    return {
      background: `var(--${accentColor}-a3)`,
      text: `var(--${accentColor}-12)`,
      border: `var(--${accentColor}-9)`,
    };
  }
  return {
    background: 'var(--accent-a3)',
    text: 'var(--accent-12)',
    border: 'var(--accent-9)',
  };
}

function computeButtonStyle(isCollapsed: boolean, isActive: boolean, accent: AccentTokens, accentColor: string | undefined): React.CSSProperties {
  let borderLeft = '3px solid transparent';
  if (isCollapsed) {
    borderLeft = 'none';
  } else if (isActive && accentColor) {
    borderLeft = `3px solid ${accent.border}`;
  }
  return {
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    backgroundColor: isActive ? accent.background : 'transparent',
    borderRadius: 'var(--radius-2)',
    color: 'var(--gray-12)',
    minHeight: '44px',
    height: '44px',
    borderLeft,
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    padding: 'var(--space-2) var(--space-3)',
  };
}

function renderBadgeContent(badge: SidebarItem['badge']): React.ReactNode {
  return typeof badge === 'number' && badge > 9 ? '9+' : badge;
}

function CollapsedItemContent({ item, isActive }: { item: SidebarItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Flex align="center" justify="center" position="relative">
      <Icon
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        color={isActive ? 'var(--accent-11)' : 'var(--gray-11)'}
        aria-hidden="true"
      />
      {item.badge && (
        <Badge
          radius="full"
          variant="soft"
          color={item.accentColor as BadgeColor}
          highContrast
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            minWidth: '16px',
            justifyContent: 'center',
          }}
        >
          {renderBadgeContent(item.badge)}
        </Badge>
      )}
    </Flex>
  );
}

function ExpandedItemContent({ item, isActive }: { item: SidebarItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Flex align="center" gap="3" width="100%">
      <Icon
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        color={isActive ? 'var(--accent-11)' : 'var(--gray-11)'}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
      <Text
        size="2"
        weight={isActive ? 'bold' : 'regular'}
        style={{
          flex: 1,
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {item.label}
      </Text>
      {item.badge && (
        <Badge
          radius="full"
          variant="soft"
          color={item.accentColor as BadgeColor}
          highContrast
        >
          {item.badge}
        </Badge>
      )}
    </Flex>
  );
}

export function SidebarItems({
  isCollapsed = false,
  activeItem,
  onItemClick,
  onItemPreload,
  sections
}: SidebarItemsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const flatItems = sections.flatMap((s) => s.items);
  const activeIndex = flatItems.findIndex((it) => it.id === activeItem);
  const [focusIndex, setFocusIndex] = useState(activeIndex >= 0 ? activeIndex : 0);
  const { handleNavigationKey } = useListNavigation(listRef, '[data-sidebar-nav-item]', {
    axis: 'vertical',
    rovingTabIndex: true,
  });

  useEffect(() => {
    if (activeIndex >= 0) setFocusIndex(activeIndex);
  }, [activeIndex]);

  const handleItemClick = (itemId: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else if (onItemClick) {
      onItemClick(itemId);
    }
  };

  let flatIndex = 0;

  return (
    <Flex direction="column" gap="2" ref={listRef}>
      {sections.map((section, sectionIndex) => {
        const labelId = `sidebar-section-${section.id}-label`;
        return (
          <Box
            key={section.id}
            data-testid={`sidebar-section-${section.id}`}
            role="group"
            aria-labelledby={isCollapsed ? undefined : labelId}
            aria-label={isCollapsed ? section.label : undefined}
            mt={sectionIndex === 0 ? '0' : '3'}
          >
            {isCollapsed ? (
              sectionIndex > 0 && <Separator size="4" my="2" />
            ) : (
              <Text
                id={labelId}
                as="div"
                weight="medium"
                color="gray"
                mb="1"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '10.5px',
                  fontFamily: 'var(--code-font-family)',
                  lineHeight: 1.4,
                  paddingLeft: 'var(--space-2)',
                }}
              >
                {section.label}
              </Text>
            )}
            <Flex direction="column" gap="2">
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
                const accent = resolveAccentTokens(item.accentColor);
                const itemIndex = flatIndex++;

                return (
                  <Button
                    key={item.id}
                    data-testid={`sidebar-nav-item-${item.id}`}
                    data-sidebar-nav-item=""
                    variant="ghost"
                    size="3"
                    onClick={() => handleItemClick(item.id, item.onClick)}
                    onMouseEnter={() => onItemPreload?.(item.id)}
                    onFocus={() => {
                      setFocusIndex(itemIndex);
                      onItemPreload?.(item.id);
                    }}
                    onKeyDown={(e) => handleNavigationKey(e, itemIndex)}
                    tabIndex={itemIndex === focusIndex ? 0 : -1}
                    aria-label={isCollapsed ? item.label : undefined}
                    title={isCollapsed ? item.label : undefined}
                    style={computeButtonStyle(isCollapsed, isActive, accent, item.accentColor)}
                  >
                    {isCollapsed
                      ? <CollapsedItemContent item={item} isActive={isActive} />
                      : <ExpandedItemContent item={item} isActive={isActive} />}
                  </Button>
                );
              })}
            </Flex>
          </Box>
        );
      })}
    </Flex>
  );
}
