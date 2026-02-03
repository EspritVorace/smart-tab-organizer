import React from 'react';
import { Callout } from '@radix-ui/themes';
import { Info, AlertTriangle, XCircle } from 'lucide-react';
import { FEATURE_CALLOUT_COLORS, DEFAULT_CALLOUT_COLORS, CalloutColor } from '../../../utils/themeConstants';

interface ThemedCalloutProps {
  children: React.ReactNode;
  variant?: 'soft' | 'surface' | 'outline';
  size?: '1' | '2' | '3';
  style?: React.CSSProperties;
}

interface InfoCalloutProps extends ThemedCalloutProps {
  theme?: CalloutColor;
}

interface WarningCalloutProps extends ThemedCalloutProps {
  theme?: CalloutColor;
}

interface ErrorCalloutProps extends ThemedCalloutProps {
  theme?: CalloutColor;
}

// Callouts par type avec thème paramétrable
export function InfoCallout({ children, theme = DEFAULT_CALLOUT_COLORS.INFO, variant = 'soft', size, style }: InfoCalloutProps) {
  return (
    <Callout.Root color={theme} variant={variant} size={size} style={style}>
      <Callout.Icon>
        <Info />
      </Callout.Icon>
      <Callout.Text>
        {children}
      </Callout.Text>
    </Callout.Root>
  );
}

export function WarningCallout({ children, theme = DEFAULT_CALLOUT_COLORS.WARNING, variant = 'soft', size, style }: WarningCalloutProps) {
  return (
    <Callout.Root color={theme} variant={variant} size={size} style={style}>
      <Callout.Icon>
        <AlertTriangle />
      </Callout.Icon>
      <Callout.Text>
        {children}
      </Callout.Text>
    </Callout.Root>
  );
}

export function ErrorCallout({ children, theme = DEFAULT_CALLOUT_COLORS.ERROR, variant = 'soft', size, style }: ErrorCalloutProps) {
  return (
    <Callout.Root color={theme} variant={variant} size={size} style={style}>
      <Callout.Icon>
        <XCircle />
      </Callout.Icon>
      <Callout.Text>
        {children}
      </Callout.Text>
    </Callout.Root>
  );
}

// Helpers pour créer des callouts avec thème spécifique et couleurs nuancées
export const DomainRulesCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.DOMAIN_RULES.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.DOMAIN_RULES.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.DOMAIN_RULES.ERROR} {...props} />
};

export const RegexPresetsCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.REGEX_PRESETS.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.REGEX_PRESETS.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.REGEX_PRESETS.ERROR} {...props} />
};


export const ImportCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.IMPORT.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.IMPORT.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.IMPORT.ERROR} {...props} />
};

export const ExportCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.EXPORT.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.EXPORT.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.EXPORT.ERROR} {...props} />
};

export const StatisticsCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.STATISTICS.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.STATISTICS.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.STATISTICS.ERROR} {...props} />
};

export const SettingsCallouts = {
  Info: (props: ThemedCalloutProps) => <InfoCallout theme={FEATURE_CALLOUT_COLORS.SETTINGS.INFO} {...props} />,
  Warning: (props: ThemedCalloutProps) => <WarningCallout theme={FEATURE_CALLOUT_COLORS.SETTINGS.WARNING} {...props} />,
  Error: (props: ThemedCalloutProps) => <ErrorCallout theme={FEATURE_CALLOUT_COLORS.SETTINGS.ERROR} {...props} />
};