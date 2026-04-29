import { Flex, Text, Button, Box } from '@radix-ui/themes';
import { SidebarItem } from './Sidebar';
import { IconBox } from '@/components/UI/IconBox/IconBox';

interface SidebarItemsProps {
  isCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  items: SidebarItem[];
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

function CollapsedItemContent({ item, accent }: { item: SidebarItem; accent: AccentTokens }) {
  const Icon = item.icon;
  return (
    <Flex align="center" justify="center" position="relative">
      <IconBox icon={Icon} size="sm" variant="gradient" />
      {item.badge && (
        <Box
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: accent.background,
            color: accent.text,
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 'bold',
            lineHeight: 1,
            padding: '2px',
            minWidth: '14px',
            minHeight: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderBadgeContent(item.badge)}
        </Box>
      )}
    </Flex>
  );
}

function ExpandedItemContent({ item, accent }: { item: SidebarItem; accent: AccentTokens }) {
  const Icon = item.icon;
  return (
    <Flex align="center" gap="3" width="100%">
      <IconBox icon={Icon} size="sm" variant="gradient" />
      <Text size="2" style={{
        flex: 1,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center'
      }}>
        {item.label}
      </Text>
      {item.badge && (
        <Box
          style={{
            backgroundColor: accent.background,
            color: accent.text,
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 'bold',
            lineHeight: 1,
            padding: '2px 6px',
            minWidth: '18px',
            textAlign: 'center'
          }}
        >
          {item.badge}
        </Box>
      )}
    </Flex>
  );
}

export function SidebarItems({
  isCollapsed = false,
  activeItem,
  onItemClick,
  items
}: SidebarItemsProps) {
  const handleItemClick = (itemId: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else if (onItemClick) {
      onItemClick(itemId);
    }
  };

  return (
    <Flex direction="column" gap="2">
      {items.map((item) => {
        const isActive = activeItem === item.id;
        const accent = resolveAccentTokens(item.accentColor);

        return (
          <Button
            key={item.id}
            data-testid={`sidebar-nav-item-${item.id}`}
            variant="ghost"
            size="3"
            onClick={() => handleItemClick(item.id, item.onClick)}
            aria-label={isCollapsed ? item.label : undefined}
            title={isCollapsed ? item.label : undefined}
            style={computeButtonStyle(isCollapsed, isActive, accent, item.accentColor)}
          >
            {isCollapsed
              ? <CollapsedItemContent item={item} accent={accent} />
              : <ExpandedItemContent item={item} accent={accent} />}
          </Button>
        );
      })}
    </Flex>
  );
}