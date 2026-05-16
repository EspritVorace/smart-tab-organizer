import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/TipsSection.stories';
import { TIPS } from '../../src/components/HomePage/data';

const {
  TipsSectionCards,
  TipsSectionListe,
  TipsSectionAccordeon,
} = composeStories(stories);

const LAST_TIP_INDEX = TIPS.length - 1;

describe('TipsSection (portable stories)', () => {
  it('cards story renders carousel controls, dots, and navigates with chevrons + dot clicks', () => {
    render(<TipsSectionCards />);

    expect(screen.getByTestId('home-tips')).toBeInTheDocument();
    expect(screen.getByTestId('home-tips-prev')).toBeInTheDocument();
    expect(screen.getByTestId('home-tips-next')).toBeInTheDocument();
    expect(screen.getByTestId('home-tips-current')).toBeInTheDocument();
    for (let i = 0; i < 5; i += 1) {
      expect(screen.getByTestId(`home-tips-dot-${i}`)).toBeInTheDocument();
    }

    // Initial state: dot 0 is selected.
    expect(screen.getByTestId('home-tips-dot-0')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('home-tips-dot-1')).toHaveAttribute('aria-selected', 'false');

    // Next chevron advances to 1.
    fireEvent.click(screen.getByTestId('home-tips-next'));
    expect(screen.getByTestId('home-tips-dot-1')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('home-tips-dot-0')).toHaveAttribute('aria-selected', 'false');

    // Direct dot click jumps to 3.
    fireEvent.click(screen.getByTestId('home-tips-dot-3'));
    expect(screen.getByTestId('home-tips-dot-3')).toHaveAttribute('aria-selected', 'true');

    // Wrap-around: jump back to dot 0 then click Prev to wrap to the last tip.
    fireEvent.click(screen.getByTestId('home-tips-dot-0'));
    fireEvent.click(screen.getByTestId('home-tips-prev'));
    expect(screen.getByTestId(`home-tips-dot-${LAST_TIP_INDEX}`)).toHaveAttribute('aria-selected', 'true');
  });

  it('liste story renders the section without carousel controls or dots', () => {
    render(<TipsSectionListe />);
    expect(screen.queryByTestId('home-tips-prev')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-tips-next')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-tips-dot-0')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('accordeon story renders 5 triggers with t1 open, and toggles the open item on click', () => {
    render(<TipsSectionAccordeon />);

    for (const id of ['t1', 't2', 't3', 't4', 't5']) {
      expect(screen.getByTestId(`home-tips-accordion-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('home-tips-accordion-t1')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('home-tips-accordion-t2')).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByTestId('home-tips-accordion-t3'));
    expect(screen.getByTestId('home-tips-accordion-t3')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('home-tips-accordion-t1')).toHaveAttribute('aria-expanded', 'false');
  });
});
