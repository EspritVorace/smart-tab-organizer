import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { FieldLabel } from '../../src/components/Form/FormFields/FieldLabel';
import { FieldError } from '../../src/components/Form/FormFields/FieldError';
import { FormField } from '../../src/components/Form/FormFields/FormField';

// Wrapper for Radix UI components.
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('Form Components', () => {
  describe('FieldLabel', () => {
    it('renders the label without an asterisk by default', () => {
      render(
        <TestWrapper>
          <FieldLabel>My Label</FieldLabel>
        </TestWrapper>
      );

      expect(screen.getByText('My Label')).toBeInTheDocument();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders a red asterisk when required', () => {
      render(
        <TestWrapper>
          <FieldLabel required>Required field</FieldLabel>
        </TestWrapper>
      );

      expect(screen.getByText('Required field')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('FieldError', () => {
    it('renders nothing when there is no error', () => {
      const { container } = render(
        <TestWrapper>
          <FieldError error={undefined} />
        </TestWrapper>
      );

      // The Theme wrapper still renders, but FieldError's content is empty.
      const themeWrapper = container.querySelector('.radix-themes');
      expect(themeWrapper?.textContent).toBe('');
    });

    it('renders the error message', () => {
      render(
        <TestWrapper>
          <FieldError error={{ message: 'This field is invalid' }} />
        </TestWrapper>
      );

      expect(screen.getByText('This field is invalid')).toBeInTheDocument();
    });

    it('renders nothing when an error exists without a message', () => {
      render(
        <TestWrapper>
          <FieldError error={{}} />
        </TestWrapper>
      );

      // The component renders an empty Text when an error exists without a message.
      expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('renders the label and the children', () => {
      render(
        <TestWrapper>
          <FormField label="Username">
            <input data-testid="input-field" />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByTestId('input-field')).toBeInTheDocument();
    });

    it('renders the asterisk when required', () => {
      render(
        <TestWrapper>
          <FormField label="Email" required>
            <input />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders the error when one is present', () => {
      render(
        <TestWrapper>
          <FormField label="Password" error={{ message: 'Password too short' }}>
            <input type="password" />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('does not render an error when none is present', () => {
      render(
        <TestWrapper>
          <FormField label="Address">
            <input />
          </FormField>
        </TestWrapper>
      );

      // No error displayed.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
