import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/OptionsLayout/OptionsFooter.stories';

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      create: vi.fn(),
    },
    i18n: {
      getMessage: (key: string) => key,
    },
  },
}));

import { browser } from 'wxt/browser';

const mockedTabsCreate = browser.tabs.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedTabsCreate.mockClear();
});

const { OptionsFooterDefault, OptionsFooterCollapsedStory } = composeStories(stories);

describe('OptionsFooter (portable stories)', () => {
  it('renders the expanded footer with username and GitHub icon', () => {
    render(<OptionsFooterDefault />);
    expect(screen.getByTestId('options-footer')).toBeInTheDocument();
    expect(screen.getByText('EspritVorace')).toBeInTheDocument();
    expect(screen.getByAltText('EspritVorace')).toBeInTheDocument();
  });

  it('renders the collapsed footer with avatar only', () => {
    render(<OptionsFooterCollapsedStory />);
    expect(screen.getByAltText('EspritVorace')).toBeInTheDocument();
    expect(screen.queryByText('EspritVorace')).not.toBeInTheDocument();
  });
});

describe('OptionsFooter - branches', () => {
  it('ouvre GitHub via browser.tabs.create au clic', () => {
    render(<OptionsFooterDefault />);
    fireEvent.click(screen.getByTestId('options-footer'));
    expect(mockedTabsCreate).toHaveBeenCalledWith({
      url: 'https://github.com/EspritVorace/smart-tab-organizer',
    });
  });

  it('ouvre GitHub au clavier (Enter)', () => {
    render(<OptionsFooterDefault />);
    fireEvent.keyDown(screen.getByTestId('options-footer'), { key: 'Enter' });
    expect(mockedTabsCreate).toHaveBeenCalledWith({
      url: 'https://github.com/EspritVorace/smart-tab-organizer',
    });
  });

  it('ouvre GitHub au clavier (Space)', () => {
    render(<OptionsFooterDefault />);
    fireEvent.keyDown(screen.getByTestId('options-footer'), { key: ' ' });
    expect(mockedTabsCreate).toHaveBeenCalledWith({
      url: 'https://github.com/EspritVorace/smart-tab-organizer',
    });
  });

  it("n'ouvre pas GitHub sur une autre touche", () => {
    render(<OptionsFooterDefault />);
    fireEvent.keyDown(screen.getByTestId('options-footer'), { key: 'Tab' });
    expect(mockedTabsCreate).not.toHaveBeenCalled();
  });
});
