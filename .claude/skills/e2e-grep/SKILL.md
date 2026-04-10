---
name: e2e-grep
description: Lance les tests E2E Playwright avec un filtre grep sur le nom du test ou l'ID de user story (ex: "IE005", "sessions", "popup")
disable-model-invocation: true
---

Run the following command in /c/devhome/git/smart-tab-organizer:

```bash
pnpm test:e2e --grep "<args>"
```

If no args provided, print usage: `/e2e-grep "<pattern>"` where pattern can be a test name fragment or US ID (e.g. `US-PO007`, `IE005.*Ignore`, `sessions`).
