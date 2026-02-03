import React from 'react';
import { Badge } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { badgeOptions, type BadgeType } from '../../../schemas/enums';

interface StatusBadgeProps {
    type: BadgeType;
    size?: '1' | '2' | '3';
}

export function StatusBadge({ type, size = '1' }: StatusBadgeProps) {
    const badgeOption = badgeOptions.find(option => option.value === type);
    
    if (!badgeOption) {
        return null;
    }

    return (
        <Badge color={badgeOption.color} size={size}>
            {getMessage(badgeOption.keyLabel)}
        </Badge>
    );
}