import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/MiniStatsSection.stories';

const {
  MiniStatsSectionDefault,
  MiniStatsSectionLargeNumbers,
  MiniStatsSectionAllZero,
  MiniStatsSectionEnglishLocale,
} = composeStories(stories);

describe('MiniStatsSection (portable stories)', () => {
  it('default story renders the three stats, displays values, and routes onNavigate per card', () => {
    const onNavigate = vi.fn();
    render(<MiniStatsSectionDefault onNavigate={onNavigate} />);

    expect(screen.getByTestId('home-mini-stat-groups')).toBeInTheDocument();
    expect(screen.getByTestId('home-mini-stat-dedup')).toBeInTheDocument();
    expect(screen.getByTestId('home-mini-stat-sessions')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('home-mini-stat-groups'));
    expect(onNavigate).toHaveBeenLastCalledWith('stats');
    fireEvent.click(screen.getByTestId('home-mini-stat-dedup'));
    expect(onNavigate).toHaveBeenLastCalledWith('stats');
    fireEvent.click(screen.getByTestId('home-mini-stat-sessions'));
    expect(onNavigate).toHaveBeenLastCalledWith('sessions');
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });

  it('formats large numbers with the FR locale by default', () => {
    render(<MiniStatsSectionLargeNumbers />);
    const groups = screen.getByTestId('home-mini-stat-groups');
    expect(groups.textContent).toContain('12');
    expect(groups.textContent).toContain('345');
    // FR locale uses a thin/regular space, never a comma.
    expect(groups.textContent).not.toContain('12,345');
  });

  it('formats large numbers with English locale when requested', () => {
    render(<MiniStatsSectionEnglishLocale />);
    const groups = screen.getByTestId('home-mini-stat-groups');
    expect(groups.textContent).toContain('12,345');
  });

  it('shows zero values for all three stats without throwing', () => {
    render(<MiniStatsSectionAllZero />);
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
  });
});
