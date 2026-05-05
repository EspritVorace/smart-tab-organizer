import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/HeroOnboarding.stories';

const { HeroOnboardingDefault } = composeStories(stories);

describe('HeroOnboarding (portable stories)', () => {
  it('renders title and CTAs, and wires both onClick handlers', () => {
    const onImportPack = vi.fn();
    const onCreateRule = vi.fn();
    render(
      <HeroOnboardingDefault onImportPack={onImportPack} onCreateRule={onCreateRule} />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    const importBtn = screen.getByTestId('home-hero-import');
    const createBtn = screen.getByTestId('home-hero-create-rule');
    expect(importBtn).toBeInTheDocument();
    expect(createBtn).toBeInTheDocument();

    fireEvent.click(importBtn);
    expect(onImportPack).toHaveBeenCalledTimes(1);
    expect(onCreateRule).not.toHaveBeenCalled();

    fireEvent.click(createBtn);
    expect(onCreateRule).toHaveBeenCalledTimes(1);
    expect(onImportPack).toHaveBeenCalledTimes(1);
  });
});
