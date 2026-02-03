import { Flex, Text, Button, Box } from '@radix-ui/themes';
import { SidebarItem } from './Sidebar';

interface SidebarItemsProps {
  isCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  items: SidebarItem[];
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
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="3"
            onClick={() => handleItemClick(item.id, item.onClick)}
            aria-label={isCollapsed ? item.label : undefined}
            title={isCollapsed ? item.label : undefined}
            style={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              width: '100%',
              position: 'relative',
              backgroundColor: isActive ? 'var(--gray-4)' : 'transparent',
              color: 'var(--gray-12)',
              minHeight: '44px',
              height: '44px',
              borderLeft: isActive && item.accentColor ? `3px solid var(--${item.accentColor}-9)` : undefined,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isCollapsed ? (
              <Flex align="center" justify="center" position="relative">
                <Box style={{ 
                  color: item.accentColor ? `var(--${item.accentColor}-9)` : undefined,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Icon size={18} />
                </Box>
                {item.badge && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: item.accentColor ? `var(--${item.accentColor}-9)` : 'var(--accent-9)',
                      color: item.accentColor ? `var(--${item.accentColor}-contrast)` : 'var(--accent-contrast)',
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
                    {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                  </Box>
                )}
              </Flex>
            ) : (
              <Flex align="center" gap="3" width="100%">
                <Box style={{ 
                  color: item.accentColor ? `var(--${item.accentColor}-9)` : undefined,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Icon size={18} />
                </Box>
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
                      backgroundColor: item.accentColor ? `var(--${item.accentColor}-9)` : 'var(--accent-9)',
                      color: item.accentColor ? `var(--${item.accentColor}-contrast)` : 'var(--accent-contrast)',
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
            )}
          </Button>
        );
      })}
    </Flex>
  );
}