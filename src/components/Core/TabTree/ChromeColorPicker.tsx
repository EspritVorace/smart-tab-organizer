import { useRef } from 'react';
import { Flex, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import { useListNavigation } from '@/hooks/useListNavigation';
import type { ChromeGroupColor } from '@/types/tabTree';
import styles from './ChromeColorPicker.module.css';

const CHROME_COLORS: ChromeGroupColor[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
];

export interface ChromeColorPickerProps {
  value: ChromeGroupColor;
  onChange: (color: ChromeGroupColor) => void;
}

export function ChromeColorPicker({ value, onChange }: ChromeColorPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { handleNavigationKey } = useListNavigation(listRef, '[role="radio"]', {
    axis: 'horizontal',
    rovingTabIndex: true,
  });

  return (
    <Flex
      ref={listRef}
      align="center"
      gap="1"
      role="radiogroup"
      aria-label={getMessage('colorPickerLabel')}
      style={{ flexShrink: 0 }}
    >
      {CHROME_COLORS.map((color, index) => {
        const isSelected = value === color;
        return (
          <Tooltip key={color} content={getMessage(`color_${color}`)}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={getMessage(`color_${color}`)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(color)}
              onFocus={() => onChange(color)}
              onKeyDown={(e) => handleNavigationKey(e, index)}
              className={`${styles.swatch} ${isSelected ? styles.swatchActive : ''}`}
              style={{ backgroundColor: chromeGroupColors[color] }}
            />
          </Tooltip>
        );
      })}
    </Flex>
  );
}
