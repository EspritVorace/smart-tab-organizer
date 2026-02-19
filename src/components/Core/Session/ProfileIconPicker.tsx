import React from 'react';
import { Flex, Tooltip } from '@radix-ui/themes';
import {
  Briefcase, Home, Code, BookOpen, Gamepad2,
  Music, Coffee, Globe, Star, Heart,
} from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import type { ProfileIcon } from '../../../types/session';
import { profileIcons } from '../../../types/session';
import styles from './ProfileIconPicker.module.css';

const ICON_COMPONENTS: Record<ProfileIcon, React.ElementType> = {
  briefcase: Briefcase,
  home: Home,
  code: Code,
  book: BookOpen,
  gamepad: Gamepad2,
  music: Music,
  coffee: Coffee,
  globe: Globe,
  star: Star,
  heart: Heart,
};

interface ProfileIconPickerProps {
  value?: ProfileIcon;
  onChange: (icon: ProfileIcon) => void;
}

export function ProfileIconPicker({ value, onChange }: ProfileIconPickerProps) {
  return (
    <Flex
      gap="1"
      wrap="wrap"
      style={{ maxWidth: 224 }}
      role="radiogroup"
      aria-label={getMessage('profileIconLabel')}
    >
      {profileIcons.map((icon) => {
        const IconComponent = ICON_COMPONENTS[icon];
        const isActive = value === icon;
        return (
          <Tooltip key={icon} content={getMessage(`profileIcon_${icon}`)}>
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={getMessage(`profileIcon_${icon}`)}
              onClick={() => onChange(icon)}
              className={`${styles.iconButton} ${isActive ? styles.iconButtonActive : ''}`}
            >
              <IconComponent size={18} aria-hidden="true" />
            </button>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
