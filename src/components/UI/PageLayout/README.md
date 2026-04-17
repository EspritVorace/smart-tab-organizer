# PageLayout Component

Wrapper de page utilisé par toutes les sections de l'options page. Fournit un
header (icône + titre h1), une description permanente sous le header, et un
conteneur pour le contenu.

## Utilisation

```tsx
import { PageLayout } from '@/components/UI/PageLayout';

<PageLayout
  titleKey="domainRulesTab"
  descriptionKey="domainRulesPageDescription"
  icon={Shield}
  syncSettings={settings}
>
  {(syncSettings) => (
    <YourComponent settings={syncSettings} />
  )}
</PageLayout>
```

## Props

- `titleKey` : clé i18n du titre (rendue via `getMessage()`).
- `descriptionKey` : clé i18n de la description de page (obligatoire, toujours visible sous le header).
- `icon` : icône Lucide optionnelle affichée à gauche du titre.
- `syncSettings` : paramètres synchronisés de l'extension.
- `children` : render prop qui reçoit les `syncSettings` et retourne le contenu.

## Notes

- Le thème (accent indigo) est appliqué au niveau racine de l'options page.
  PageLayout n'englobe plus son propre `<Theme>` wrapper.
- La description, quand fournie, est toujours visible (pas de dismiss, pas
  de persistance). Elle sert de contexte permanent pour l'utilisateur.
