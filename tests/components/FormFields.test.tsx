import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { FieldLabel } from '../../src/components/Form/FormFields/FieldLabel';
import { FieldError } from '../../src/components/Form/FormFields/FieldError';
import { FormField } from '../../src/components/Form/FormFields/FormField';

// Wrapper pour les composants Radix UI
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('Form Components', () => {
  describe('FieldLabel', () => {
    it('devrait afficher le label', () => {
      render(
        <TestWrapper>
          <FieldLabel>Mon Label</FieldLabel>
        </TestWrapper>
      );

      expect(screen.getByText('Mon Label')).toBeInTheDocument();
    });

    it('devrait afficher un astérisque rouge si required', () => {
      render(
        <TestWrapper>
          <FieldLabel required>Champ requis</FieldLabel>
        </TestWrapper>
      );

      expect(screen.getByText('Champ requis')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('ne devrait pas afficher d\'astérisque par défaut', () => {
      render(
        <TestWrapper>
          <FieldLabel>Champ optionnel</FieldLabel>
        </TestWrapper>
      );

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('FieldError', () => {
    it('ne devrait rien afficher si pas d\'erreur', () => {
      const { container } = render(
        <TestWrapper>
          <FieldError error={undefined} />
        </TestWrapper>
      );

      // Le Theme wrapper est toujours rendu, mais le contenu de FieldError est vide
      const themeWrapper = container.querySelector('.radix-themes');
      expect(themeWrapper?.textContent).toBe('');
    });

    it('devrait afficher le message d\'erreur', () => {
      render(
        <TestWrapper>
          <FieldError error={{ message: 'Ce champ est invalide' }} />
        </TestWrapper>
      );

      expect(screen.getByText('Ce champ est invalide')).toBeInTheDocument();
    });

    it('ne devrait rien afficher si error existe mais sans message', () => {
      render(
        <TestWrapper>
          <FieldError error={{}} />
        </TestWrapper>
      );

      // Le composant rend un Text vide si error existe mais sans message
      expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('devrait afficher le label et les enfants', () => {
      render(
        <TestWrapper>
          <FormField label="Nom d'utilisateur">
            <input data-testid="input-field" />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText("Nom d'utilisateur")).toBeInTheDocument();
      expect(screen.getByTestId('input-field')).toBeInTheDocument();
    });

    it('devrait afficher l\'astérisque si required', () => {
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

    it('devrait afficher l\'erreur si présente', () => {
      render(
        <TestWrapper>
          <FormField label="Password" error={{ message: 'Mot de passe trop court' }}>
            <input type="password" />
          </FormField>
        </TestWrapper>
      );

      expect(screen.getByText('Mot de passe trop court')).toBeInTheDocument();
    });

    it('ne devrait pas afficher d\'erreur si absente', () => {
      render(
        <TestWrapper>
          <FormField label="Adresse">
            <input />
          </FormField>
        </TestWrapper>
      );

      // Pas d'erreur affichée
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
