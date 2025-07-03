import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from './PageLayout';
import { Text, Box, Button, Flex } from '@radix-ui/themes';
import { defaultSyncSettings } from '../../../types/syncSettings';

const meta: Meta<typeof PageLayout> = {
  title: 'Components/UI/PageLayout/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['DOMAIN_RULES', 'REGEX_PRESETS', 'LOGICAL_GROUPS', 'IMPORT', 'EXPORT', 'STATISTICS', 'SETTINGS'],
    },
    titleKey: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - Domain Rules theme
export const PageLayoutDefault: Story = {
  args: {
    titleKey: 'domainRulesTab',
    theme: 'DOMAIN_RULES',
    syncSettings: defaultSyncSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Exemple de contenu pour l'onglet Domain Rules
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Nombre de règles: {settings.domainRules.length}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Ajouter une règle</Button>
          <Button variant="outline">Importer des règles</Button>
        </Flex>
      </Box>
    ),
  },
};

// Regex Presets theme
export const PageLayoutRegexPresets: Story = {
  args: {
    titleKey: 'regexPresetsTab',
    theme: 'REGEX_PRESETS',
    syncSettings: defaultSyncSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Gestion des presets regex pour l'organisation automatique
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Presets disponibles: {settings.regexPresets.length}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Nouveau preset</Button>
          <Button variant="outline">Tester regex</Button>
        </Flex>
      </Box>
    ),
  },
};

// Statistics theme
export const PageLayoutStatistics: Story = {
  args: {
    titleKey: 'statisticsTab',
    theme: 'STATISTICS',
    syncSettings: defaultSyncSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Statistiques d'utilisation de l'extension
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Groupement global: {settings.globalGroupingEnabled ? 'Activé' : 'Désactivé'}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Exporter les stats</Button>
          <Button variant="outline" color="red">Réinitialiser</Button>
        </Flex>
      </Box>
    ),
  },
};

// Settings theme with longer content
export const PageLayoutSettings: Story = {
  args: {
    titleKey: 'settings',
    theme: 'SETTINGS',
    syncSettings: {
      ...defaultSyncSettings,
      domainRules: [
        { id: '1', domain: 'example.com', enabled: true, color: 'blue' },
        { id: '2', domain: 'test.com', enabled: false, color: 'red' },
      ],
    },
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Configuration générale de l'extension
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)', marginBottom: '8px', display: 'block' }}>
            Paramètres actuels:
          </Text>
          <ul style={{ marginLeft: '16px', color: 'var(--gray-11)' }}>
            <li>Mode sombre: {settings.darkModePreference}</li>
            <li>Groupement: {settings.globalGroupingEnabled ? 'Activé' : 'Désactivé'}</li>
            <li>Déduplication: {settings.globalDeduplicationEnabled ? 'Activé' : 'Désactivé'}</li>
            <li>Règles de domaine: {settings.domainRules.length}</li>
          </ul>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Sauvegarder</Button>
          <Button variant="outline">Réinitialiser</Button>
          <Button variant="outline" color="red">Supprimer toutes les données</Button>
        </Flex>
      </Box>
    ),
  },
};