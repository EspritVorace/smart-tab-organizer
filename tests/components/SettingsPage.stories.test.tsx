import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/SettingsPage/SettingsPage.stories';

const {
  SettingsPageDefault,
  SettingsPageNotificationsDisabled,
  SettingsPageGroupingOnly,
  SettingsPageDedupUnmatchedDisabled,
  SettingsPageKeepNewStrategy,
  SettingsPageKeepGroupedStrategy,
  SettingsPageKeepGroupedOrNewStrategy,
  SettingsPageToggleNotifyGroup,
  SettingsPageToggleNotifyDedup,
  SettingsPageToggleDedupUnmatched,
  SettingsPageClickKeepOld,
} = composeStories(stories);

describe('SettingsPage — static renders', () => {
  it('renders settings controls', () => {
    render(<SettingsPageDefault />);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
    expect(screen.getByTestId('page-settings-toggle-notify-group')).toBeInTheDocument();
    expect(screen.getByTestId('page-settings-toggle-notify-dedup')).toBeInTheDocument();
    expect(screen.getByTestId('page-settings-toggle-dedup-unmatched')).toBeInTheDocument();
  });

  it('renders with notifications disabled', () => {
    render(<SettingsPageNotificationsDisabled />);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders with grouping notification only', () => {
    render(<SettingsPageGroupingOnly />);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders with dedup unmatched disabled', () => {
    render(<SettingsPageDedupUnmatchedDisabled />);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('renders keep-new strategy selected', () => {
    render(<SettingsPageKeepNewStrategy />);
    expect(screen.getByTestId('page-settings-dedup-keep-keep-new')).toBeInTheDocument();
  });

  it('renders keep-grouped strategy selected', () => {
    render(<SettingsPageKeepGroupedStrategy />);
    expect(screen.getByTestId('page-settings-dedup-keep-keep-grouped')).toBeInTheDocument();
  });

  it('renders keep-grouped-or-new strategy selected', () => {
    render(<SettingsPageKeepGroupedOrNewStrategy />);
    expect(screen.getByTestId('page-settings-dedup-keep-keep-grouped-or-new')).toBeInTheDocument();
  });
});

describe('SettingsPage — interactions', () => {
  it('toggles notify on grouping without throwing', async () => {
    await SettingsPageToggleNotifyGroup.run();
    expect(screen.getByTestId('page-settings-toggle-notify-group')).toBeInTheDocument();
  });

  it('toggles notify on deduplication without throwing', async () => {
    await SettingsPageToggleNotifyDedup.run();
    expect(screen.getByTestId('page-settings-toggle-notify-dedup')).toBeInTheDocument();
  });

  it('toggles dedup unmatched without throwing', async () => {
    await SettingsPageToggleDedupUnmatched.run();
    expect(screen.getByTestId('page-settings-toggle-dedup-unmatched')).toBeInTheDocument();
  });

  it('clicks keep-old radio without throwing', async () => {
    await SettingsPageClickKeepOld.run();
    expect(screen.getByTestId('page-settings-dedup-keep-keep-old')).toBeInTheDocument();
  });
});
