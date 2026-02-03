# PageLayout Component

Le composant `PageLayout` est un composant générique qui standardise la mise en page des pages de l'extension. Il fournit une structure cohérente avec titre, thème et gestion des paramètres.

## Utilisation

```tsx
import { PageLayout } from '../components/UI/PageLayout';

<PageLayout
  titleKey="domainRulesTab"
  theme="DOMAIN_RULES"
  syncSettings={settings}
>
  {(syncSettings) => (
    <YourComponent settings={syncSettings} />
  )}
</PageLayout>
```

## Props

- `titleKey`: Clé de traduction pour le titre de la page (sera traduite via `getMessage()`)
- `theme`: Thème de la fonctionnalité (voir `FeatureTheme` dans `themeConstants.ts`)
- `syncSettings`: Les paramètres synchronisés de l'extension
- `children`: Fonction render prop qui reçoit les `syncSettings` et retourne le contenu

## Fonctionnalités

- **Titre automatique** : Le titre est traduit automatiquement via i18n
- **Thématisation** : Applique automatiquement le thème approprié avec Radix UI
- **Layout complet** : Prend toute la largeur disponible avec padding cohérent
- **Render prop** : Passe les SyncSettings au composant enfant via une render prop

## Thèmes disponibles

- `DOMAIN_RULES` - Règles de domaine (purple)
- `REGEX_PRESETS` - Presets regex (cyan)
- `IMPORT` - Import (jade)
- `EXPORT` - Export (teal)
- `STATISTICS` - Statistiques (orange)
- `SETTINGS` - Paramètres (gray)

## Exemple d'intégration

Remplace l'ancien pattern :
```tsx
{currentTab === 'rules' && (
  <DomainRulesTheme>
    <RulesTab settings={settings} updateRules={updateRules} />
  </DomainRulesTheme>
)}
```

Par le nouveau :
```tsx
{currentTab === 'rules' && (
  <PageLayout
    titleKey="domainRulesTab"
    theme="DOMAIN_RULES"
    syncSettings={settings}
  >
    {(syncSettings) => (
      <RulesTab 
        settings={syncSettings} 
        updateRules={updateRules} 
      />
    )}
  </PageLayout>
)}
```

## Avantages

- **Consistance** : Même structure pour toutes les pages
- **Réutilisabilité** : Un seul composant pour toutes les pages
- **Maintien** : Centralisation de la logique de layout
- **Thématisation** : Gestion automatique des thèmes
- **Type safety** : Props typées avec TypeScript