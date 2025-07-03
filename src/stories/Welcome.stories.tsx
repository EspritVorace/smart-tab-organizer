import type { Meta, StoryObj } from '@storybook/react';

// Simple welcome component
const Welcome = () => {
  return (
    <div style={{ 
      padding: '3rem', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      color: 'var(--color-text, #333)',
      backgroundColor: 'var(--color-background, #fff)'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '1rem',
        color: 'var(--color-heading, #333)'
      }}>
        Smart Tab Organizer
      </h1>
      
      <p style={{ 
        fontSize: '1.2rem', 
        marginBottom: '2rem',
        color: 'var(--color-text-secondary, #666)',
        lineHeight: '1.6'
      }}>
        Welcome to the Smart Tab Organizer extension component documentation.
      </p>

      <div style={{ 
        backgroundColor: 'var(--color-card-background, #f8f9fa)', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid var(--color-border, rgba(0,0,0,0.1))'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: 'var(--color-heading, #333)'
        }}>
          📚 Navigation
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          margin: 0
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-heading, #333)' }}>
              Core Components
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Core/DomainRule/</strong> - Domain rule management
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Core/RegexPreset/</strong> - Regex preset components
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Core/Statistics/</strong> - Statistics display
              </li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-heading, #333)' }}>
              UI Components
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>UI/Sidebar/</strong> - Navigation sidebar
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>UI/Header/</strong> - Page headers
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>UI/PopupHeader/</strong> - Popup headers
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>UI/SettingsToggles/</strong> - Settings controls
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>UI/ThemeToggle/</strong> - Theme switcher
              </li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-heading, #333)' }}>
              Form & Utility
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Form/FormFields/</strong> - Form field components
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Form/themed-callouts/</strong> - Themed callouts
              </li>
              <li style={{ marginBottom: '0.3rem', color: 'var(--color-text, #333)' }}>
                <strong>Form/themes/</strong> - Theme components
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'var(--color-card-background, #e3f2fd)', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid var(--color-border, rgba(0,0,0,0.1))'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: 'var(--color-heading, #333)'
        }}>
          🚀 Getting Started
        </h2>
        
        <p style={{ 
          margin: 0,
          color: 'var(--color-text-secondary, #666)',
          lineHeight: '1.6'
        }}>
          Explore the components in the sidebar to see their different states and properties.
          Each component includes automatic documentation and usage examples.
        </p>
      </div>

      <div style={{ 
        backgroundColor: 'var(--color-card-background, #f3e5f5)', 
        padding: '2rem', 
        borderRadius: '8px',
        border: '1px solid var(--color-border, rgba(0,0,0,0.1))'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: 'var(--color-heading, #333)'
        }}>
          🛠️ Development
        </h2>
        
        <p style={{ 
          margin: 0,
          color: 'var(--color-text-secondary, #666)',
          lineHeight: '1.6'
        }}>
          This extension uses <strong>Preact</strong> with <strong>TypeScript</strong> and <strong>Radix UI</strong> 
          to create a modern and accessible user interface.
        </p>
      </div>
    </div>
  );
};

const meta: Meta<typeof Welcome> = {
  title: 'Welcome',
  component: Welcome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: null,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {};