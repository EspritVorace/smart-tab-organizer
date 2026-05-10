# PageLayout Component

Page wrapper used by every section of the options page. Provides a header
(icon plus h1 title), a persistent description below the header, and a
content container.

## Usage

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

- `titleKey`: i18n key for the title (rendered via `getMessage()`).
- `descriptionKey`: i18n key for the page description (required, always
  visible below the header).
- `icon`: optional Lucide icon rendered to the left of the title.
- `syncSettings`: the extension's synced settings.
- `children`: render prop that receives the `syncSettings` and returns the
  content.

## Notes

- The theme (indigo accent) is applied at the options page root.
  PageLayout no longer wraps its own `<Theme>` provider.
- When provided, the description is always visible (no dismiss, no
  persistence). It serves as permanent context for the user.
