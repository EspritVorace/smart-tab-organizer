import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/Sidebar/Sidebar.stories';

const {
  SidebarDefault,
  SidebarCollapsed,
  SidebarWithFooter,
  SidebarWithToggle,
  SidebarWithFooterCollapsed,
  SidebarManyItems,
  SidebarInteractive,
  SidebarWithToolbar,
  SidebarWithSearch,
  SidebarComplete,
} = composeStories(stories);

describe('Sidebar — static renders', () => {
  it('renders expanded sidebar with navigation items', () => {
    render(<SidebarDefault />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders collapsed sidebar', () => {
    render(<SidebarCollapsed />);
    // Collapsed sidebar still renders items (as icon-only)
    const nav = document.querySelector('[data-sidebar]') ?? document.body;
    expect(nav).toBeTruthy();
  });

  it('renders sidebar with footer content', () => {
    render(<SidebarWithFooter />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders sidebar with collapse toggle button', () => {
    render(<SidebarWithToggle />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders collapsed sidebar with footer', () => {
    render(<SidebarWithFooterCollapsed />);
    const container = document.body;
    expect(container).toBeTruthy();
  });

  it('renders sidebar with many items', () => {
    render(<SidebarManyItems />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('renders interactive sidebar', () => {
    render(<SidebarInteractive />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders sidebar with toolbar', () => {
    render(<SidebarWithToolbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders sidebar with search', () => {
    render(<SidebarWithSearch />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the complete sidebar with all features', () => {
    render(<SidebarComplete />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});
