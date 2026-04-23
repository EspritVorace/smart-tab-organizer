import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  DomainRulesTheme,
  RegexPresetsTheme,
  ImportTheme,
  ExportTheme,
  StatisticsTheme,
  SettingsTheme,
  SessionsTheme,
} from '../../src/components/Form/themes/index';

describe('Form theme wrappers', () => {
  it.each([
    ['DomainRulesTheme', DomainRulesTheme],
    ['RegexPresetsTheme', RegexPresetsTheme],
    ['ImportTheme', ImportTheme],
    ['ExportTheme', ExportTheme],
    ['StatisticsTheme', StatisticsTheme],
    ['SettingsTheme', SettingsTheme],
    ['SessionsTheme', SessionsTheme],
  ] as const)('%s renders children', (_name, ThemeWrapper) => {
    render(
      React.createElement(ThemeWrapper, null,
        React.createElement('span', { 'data-testid': 'child' }, 'content'),
      ),
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
