import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from './PageLayout';
import { Text, Box, Button, Flex } from '@radix-ui/themes';
import { Shield, FileText, BarChart3 } from 'lucide-react';
import { defaultAppSettings } from '@/types/syncSettings';

const meta: Meta<typeof PageLayout> = {
  title: 'Components/UI/PageLayout/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    titleKey: {
      control: 'text',
    },
    descriptionKey: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PageLayoutDomainRules: Story = {
  args: {
    titleKey: 'domainRulesTab',
    descriptionKey: 'domainRulesPageDescription',
    icon: Shield,
    syncSettings: defaultAppSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Gestion des règles de domaine pour le groupement automatique
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Nombre de règles: {settings.domainRules.length}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Ajouter une règle</Button>
        </Flex>
      </Box>
    ),
  },
};

export const PageLayoutImportExport: Story = {
  args: {
    titleKey: 'importExportTab',
    descriptionKey: 'importExportPageDescription',
    icon: FileText,
    syncSettings: defaultAppSettings,
    children: () => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Importer ou exporter vos paramètres
        </Text>
        <Flex gap="3">
          <Button variant="solid">Exporter</Button>
          <Button variant="outline">Importer</Button>
        </Flex>
      </Box>
    ),
  },
};

export const PageLayoutStatistics: Story = {
  args: {
    titleKey: 'statisticsTab',
    descriptionKey: 'statisticsPageDescription',
    icon: BarChart3,
    syncSettings: defaultAppSettings,
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
          <Button variant="outline" color="red">Réinitialiser</Button>
        </Flex>
      </Box>
    ),
  },
};
