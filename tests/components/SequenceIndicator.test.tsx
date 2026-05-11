import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { SequenceIndicator } from '../../src/components/UI/SequenceIndicator/SequenceIndicator';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('SequenceIndicator', () => {
  it('renders nothing when activePrefix is null', () => {
    const { container } = render(
      <TestWrapper>
        <SequenceIndicator activePrefix={null} />
      </TestWrapper>,
    );
    expect(container.querySelector('[data-testid="sequence-indicator"]')).toBeNull();
  });

  it('renders nothing when activePrefix is an empty array', () => {
    const { container } = render(
      <TestWrapper>
        <SequenceIndicator activePrefix={[]} />
      </TestWrapper>,
    );
    expect(container.querySelector('[data-testid="sequence-indicator"]')).toBeNull();
  });

  it('renders the prefix as a status region with aria-live="polite"', () => {
    render(
      <TestWrapper>
        <SequenceIndicator activePrefix={['i']} />
      </TestWrapper>,
    );
    const indicator = screen.getByTestId('sequence-indicator');
    expect(indicator).toHaveAttribute('role', 'status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
  });

  it('shows each combo from the active prefix', () => {
    render(
      <TestWrapper>
        <SequenceIndicator activePrefix={['i', 'r']} />
      </TestWrapper>,
    );
    const indicator = screen.getByTestId('sequence-indicator');
    expect(indicator.textContent).toContain('I');
    expect(indicator.textContent).toContain('R');
  });
});
