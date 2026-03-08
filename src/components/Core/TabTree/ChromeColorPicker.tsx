import React from 'react';
import { Flex, Tooltip } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { chromeGroupColors } from './tabTreeUtils';
import type { ChromeGroupColor } from './tabTreeTypes';
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
  return (
    <Flex
      align="center"
      gap="1"
      role="radiogroup"
      aria-label={getMessage('colorPickerLabel')}
      style={{ flexShrink: 0 }}
    >
      {CHROME_COLORS.map((color) => (
        <Tooltip key={color} content={getMessage(`color_${color}`)}>
          <button
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={getMessage(`color_${color}`)}
            onClick={() => onChange(color)}
            className={`${styles.swatch} ${value === color ? styles.swatchActive : ''}`}
            style={{ backgroundColor: chromeGroupColors[color] }}
          />
        </Tooltip>
      ))}
    </Flex>
  );
}
