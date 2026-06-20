import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Exploration/ExplorationDomainGroup.stories';

const composed = composeStories(stories);

/** The collapsible header button (a nav item) of a rendered domain group. */
function headerButton(): HTMLButtonElement {
  return document.querySelector('[data-exploration-nav-item]') as HTMLButtonElement;
}

describe('ExplorationDomainGroup (stories)', () => {
  it('renders every story variant without throwing', () => {
    for (const Story of Object.values(composed)) {
      const { container, unmount } = render(<Story />);
      expect(container).not.toBeEmptyDOMElement();
      unmount();
    }
  });

  it('renders the expanded group with its capability rows mounted', () => {
    const { container } = render(<composed.ExplorationDomainGroupOpen />);
    // An open group mounts its rows (role="listitem").
    expect(container.querySelectorAll('[role="listitem"]').length).toBeGreaterThan(0);
  });

  it('keeps rows unmounted when the group is collapsed', () => {
    const { container } = render(<composed.ExplorationDomainGroupCollapsed />);
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(0);
  });

  it('forces rows visible when forceOpen is set even though open is false', () => {
    const { container } = render(<composed.ExplorationDomainGroupForcedOpen />);
    expect(container.querySelectorAll('[role="listitem"]').length).toBeGreaterThan(0);
  });

  it('toggles the group when the header is clicked', () => {
    const onToggle = vi.fn();
    render(<composed.ExplorationDomainGroupCollapsed onToggle={onToggle} />);
    fireEvent.click(headerButton());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('expands a collapsed group on ArrowRight from the header', () => {
    const onToggle = vi.fn();
    render(<composed.ExplorationDomainGroupCollapsed onToggle={onToggle} />);
    const btn = headerButton();
    fireEvent.keyDown(btn, { key: 'ArrowRight' });
    expect(onToggle).toHaveBeenCalledTimes(1);
    // ArrowLeft on an already-collapsed group is a no-op (nothing to close).
    fireEvent.keyDown(btn, { key: 'ArrowLeft' });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('collapses an open group on ArrowLeft and forwards other nav keys', () => {
    const onToggle = vi.fn();
    const onNavKeyDown = vi.fn();
    render(<composed.ExplorationDomainGroupOpen onToggle={onToggle} onNavKeyDown={onNavKeyDown} />);
    const btn = headerButton();
    fireEvent.keyDown(btn, { key: 'ArrowLeft' });
    expect(onToggle).toHaveBeenCalledTimes(1);
    // A non-arrow key is delegated to the cross-group navigation handler.
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    expect(onNavKeyDown).toHaveBeenCalled();
  });

  it('renders the completion badge at 100%', () => {
    render(<composed.ExplorationDomainGroupComplete />);
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });
});
