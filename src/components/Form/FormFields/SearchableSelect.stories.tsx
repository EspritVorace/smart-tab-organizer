import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { SearchableSelect, type SearchableSelectOption, type SearchableSelectGroup } from './SearchableSelect';

const meta: Meta<typeof SearchableSelect> = {
  title: 'Components/Form/FormFields/SearchableSelect',
  component: SearchableSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Sample data ───────────────────────────────────────────────────────────────

const devGroups: SearchableSelectGroup[] = [
  {
    label: 'Development & Code',
    options: [
      { value: 'github-repo', label: 'GitHub Repository' },
      { value: 'github-issue', label: 'GitHub Issue' },
      { value: 'stackoverflow-question', label: 'Stack Overflow Question' },
      { value: 'gitlab-project', label: 'GitLab Project' },
      { value: 'figma-file', label: 'Figma File' },
      { value: 'npm-package', label: 'NPM Package' },
    ],
  },
  {
    label: 'Productivity & Tickets',
    options: [
      { value: 'jira-ticket', label: 'Jira Ticket' },
      { value: 'trello-board', label: 'Trello Board' },
      { value: 'notion-page', label: 'Notion Page' },
      { value: 'asana-task', label: 'Asana Task' },
      { value: 'miro-board', label: 'Miro Board' },
    ],
  },
  {
    label: 'Generic',
    options: [
      { value: 'numeric-id', label: 'Numeric ID' },
      { value: 'alphanumeric-id', label: 'Alphanumeric ID' },
      { value: 'uuid-pattern', label: 'UUID Pattern' },
      { value: 'date-pattern', label: 'Date Pattern' },
    ],
  },
];

const flatOptions: SearchableSelectOption[] = [
  { value: 'title', label: 'Title' },
  { value: 'url', label: 'URL' },
  { value: 'smart_title', label: 'Smart (Title)' },
  { value: 'smart_url', label: 'Smart (URL)' },
  { value: 'smart_preset', label: 'Smart (Preset)' },
  { value: 'manual', label: 'Manual' },
];

// 40+ options for scroll/search testing
const longListGroups: SearchableSelectGroup[] = [
  {
    label: 'Development',
    options: [
      { value: 'github-repo', label: 'GitHub Repository' },
      { value: 'github-issue', label: 'GitHub Issue' },
      { value: 'github-pr', label: 'GitHub Pull Request' },
      { value: 'stackoverflow-question', label: 'Stack Overflow Question' },
      { value: 'gitlab-project', label: 'GitLab Project' },
      { value: 'gitlab-issue', label: 'GitLab Issue' },
      { value: 'figma-file', label: 'Figma File' },
      { value: 'figma-component', label: 'Figma Component' },
      { value: 'npm-package', label: 'NPM Package' },
      { value: 'pypi-package', label: 'PyPI Package' },
    ],
  },
  {
    label: 'Productivity',
    options: [
      { value: 'jira-ticket', label: 'Jira Ticket' },
      { value: 'jira-sprint', label: 'Jira Sprint' },
      { value: 'trello-board', label: 'Trello Board' },
      { value: 'trello-card', label: 'Trello Card' },
      { value: 'notion-page', label: 'Notion Page' },
      { value: 'notion-db', label: 'Notion Database' },
      { value: 'asana-task', label: 'Asana Task' },
      { value: 'asana-project', label: 'Asana Project' },
      { value: 'miro-board', label: 'Miro Board' },
      { value: 'miro-frame', label: 'Miro Frame' },
    ],
  },
  {
    label: 'E-commerce',
    options: [
      { value: 'amazon-product', label: 'Amazon Product' },
      { value: 'ebay-item', label: 'eBay Item' },
      { value: 'shopify-admin', label: 'Shopify Admin' },
      { value: 'shopify-product', label: 'Shopify Product' },
      { value: 'etsy-listing', label: 'Etsy Listing' },
    ],
  },
  {
    label: 'Cloud & Infrastructure',
    options: [
      { value: 'aws-console', label: 'AWS Console' },
      { value: 'aws-resource', label: 'AWS Resource' },
      { value: 'azure-portal', label: 'Azure Portal' },
      { value: 'gcp-console', label: 'GCP Console' },
      { value: 'vercel-dashboard', label: 'Vercel Dashboard' },
      { value: 'netlify-site', label: 'Netlify Site' },
    ],
  },
  {
    label: 'Search & Documentation',
    options: [
      { value: 'google-search', label: 'Google Search' },
      { value: 'mdn-docs', label: 'MDN Documentation' },
      { value: 'medium-article', label: 'Medium Article' },
      { value: 'devto-post', label: 'Dev.to Post' },
    ],
  },
  {
    label: 'Social & Communication',
    options: [
      { value: 'linkedin-profile', label: 'LinkedIn Profile' },
      { value: 'slack-workspace', label: 'Slack Workspace' },
      { value: 'zoom-meeting', label: 'Zoom Meeting' },
    ],
  },
];

// ── Wrapper for interactive stories ──────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 360, padding: 24 }}>{children}</div>;
}

// ── Stories ───────────────────────────────────────────────────────────────────

export const SearchableSelectDefault: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
};

export const SearchableSelectWithValue: Story = {
  render: () => {
    const [value, setValue] = useState('jira-ticket');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
};

export const SearchableSelectDisabled: Story = {
  render: () => (
    <Wrapper>
      <SearchableSelect
        value="github-repo"
        onValueChange={() => {}}
        groups={devGroups}
        placeholder="Choose a preset..."
        searchPlaceholder="Search a preset..."
        emptyMessage="No preset found."
        disabled
      />
    </Wrapper>
  ),
};

export const SearchableSelectFlat: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          options={flatOptions}
          placeholder="Choose a group source..."
          searchPlaceholder="Search..."
          emptyMessage="No option found."
        />
      </Wrapper>
    );
  },
};

export const SearchableSelectLongList: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={longListGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
};

export const SearchableSelectNoResults: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <p style={{ marginBottom: 12, fontSize: 13, color: '#888' }}>
          Type in the search to see no-results state (e.g. "zzz")
        </p>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
};

// Opens the dropdown by clicking the trigger button.
export const SearchableSelectOpen: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByPlaceholderText('Search a preset...')).toBeInTheDocument();
  },
};

// Types in the search box to filter options.
export const SearchableSelectFiltered: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
  play: async (context) => {
    await SearchableSelectOpen.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const searchInput = body.getByPlaceholderText('Search a preset...');
    await userEvent.type(searchInput, 'jira');
    await expect(body.getByText('Jira Ticket')).toBeInTheDocument();
  },
};

// Selects an option from the dropdown.
export const SearchableSelectChosen: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
  play: async (context) => {
    await SearchableSelectOpen.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(body.getByText('GitHub Repository'));
    // Dropdown closes and trigger shows selected label
    const canvas = within(context.canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveTextContent('GitHub Repository');
  },
};

// Types a search term that returns no results.
export const SearchableSelectEmptyResults: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Wrapper>
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          groups={devGroups}
          placeholder="Choose a preset..."
          searchPlaceholder="Search a preset..."
          emptyMessage="No preset found."
        />
      </Wrapper>
    );
  },
  play: async (context) => {
    await SearchableSelectOpen.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const searchInput = body.getByPlaceholderText('Search a preset...');
    await userEvent.type(searchInput, 'zzz-no-match');
    await expect(body.getByText('No preset found.')).toBeInTheDocument();
  },
};
