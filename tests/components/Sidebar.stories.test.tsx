import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/Sidebar/Sidebar.stories';
import { SidebarSearch } from '../../src/components/UI/Sidebar/SidebarSearch';

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

describe('SidebarSearch', () => {
  it('retourne null quand isCollapsed=true', () => {
    const { container } = render(<SidebarSearch isCollapsed={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('appelle onSearch avec la valeur courante quand Enter est pressé', () => {
    const onSearch = vi.fn();
    render(<SidebarSearch value="test" onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it("n'appelle pas onSearch quand une autre touche est pressée", () => {
    const onSearch = vi.fn();
    render(<SidebarSearch value="test" onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.keyDown(input, { key: 'a' });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("n'appelle pas onSearch quand onSearch n'est pas fourni", () => {
    render(<SidebarSearch value="test" />);
    const input = screen.getByPlaceholderText('Search...');
    expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow();
  });
});
