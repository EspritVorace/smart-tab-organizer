# Data-TestID Reference Guide

Référence complète des `data-testid` par page et composant pour les tests Playwright.

---

## 📄 PAGES

### `options.tsx` (Options Page)
```
options                           # Main options container
options-content                   # Content area (main)
```

### `popup.tsx` (Popup)
```
popup                             # Main popup container (350px width)
```

### `DomainRulesPage.tsx`
```
page-rules                        # Main page container
page-rules-toolbar                # Toolbar area (search + add button)
page-rules-search                 # Search input
page-rules-btn-add                # "Add rule" button
page-rules-list                   # List container (role="grid")
page-rules-empty                  # Empty state container
page-rules-bulk-bar               # Bulk action bar
```

### `SessionsPage.tsx`
```
page-sessions                     # Main page container
page-sessions-toolbar             # Toolbar area (search + snapshot button)
page-sessions-search              # Search input
page-sessions-btn-snapshot        # "Snapshot" button
page-sessions-list                # Sessions list container
page-sessions-empty               # Empty state message
```

### `StatisticsPage.tsx`
```
page-stats                        # Main page container
page-stats-card-groups            # Grouping statistics card
page-stats-card-dedup             # Deduplication statistics card
page-stats-btn-reset              # Reset button
```

### `SettingsPage.tsx`
```
page-settings                     # Main page container
page-settings-toggle-notify-group # Notification toggle (grouping)
page-settings-toggle-notify-dedup # Notification toggle (deduplication)
```

### `ImportExportPage.tsx`
```
page-import-export                # Main page container
page-import-export-card-export-rules     # Export rules card
page-import-export-card-import-rules     # Import rules card
page-import-export-card-export-sessions  # Export sessions card
page-import-export-card-import-sessions  # Import sessions card
```

---

## 🧩 COMPONENTS

### Layout Components

#### `PageLayout.tsx`
```
page-layout-header                # Header area
page-layout-content               # Content area
```

#### `OptionsLayout/OptionsHeader.tsx`
```
options-header                    # Options page header
```

#### `OptionsLayout/OptionsFooter.tsx`
```
options-footer                    # Options page footer
```

#### `PopupHeader.tsx`
```
popup-header                      # Popup header (role="banner")
popup-header-btn-settings         # Settings button icon
```

#### `PopupToolbar.tsx`
```
popup-toolbar                     # Toolbar container
popup-toolbar-btn-save            # Save button (appears on 2 places, same ID)
popup-toolbar-btn-restore         # Restore button
popup-toolbar-btn-organize        # Organize button
```

#### `Sidebar/Sidebar.tsx`
```
sidebar                           # Sidebar container
sidebar-collapse-btn              # Collapse button
```

#### `Sidebar/SidebarItems.tsx`
```
sidebar-nav-item-{item.id}        # Navigation items (dynamic ID)
```

### Domain Rules Components

#### `DomainRuleCard.tsx`
```
rule-card-{ruleId}                # Card container
rule-card-{ruleId}-drag-handle    # Drag handle icon
rule-card-{ruleId}-btn-dropdown   # Dropdown menu button
rule-card-{ruleId}-menu-edit      # Edit menu item
rule-card-{ruleId}-menu-move-first      # Move to first (same domain)
rule-card-{ruleId}-menu-move-last       # Move to last (same domain)
rule-card-{ruleId}-menu-move-first-domain     # Move to first (all domains)
rule-card-{ruleId}-menu-move-last-domain      # Move to last (all domains)
rule-card-{ruleId}-menu-delete    # Delete menu item
```

#### `RuleWizardModal.tsx`
```
wizard-rule                       # Main wizard dialog
wizard-rule-stepper               # Stepper component
wizard-rule-step-1                # Step 1 container
wizard-rule-step-2                # Step 2 container
wizard-rule-step-3                # Step 3 container
wizard-rule-step-4                # Step 4 container
wizard-rule-btn-save              # Save button (final step)
wizard-rule-btn-next              # Next button
wizard-rule-btn-create            # Create button (final step)
```

#### `WizardStep1Identity.tsx`
```
wizard-rule-field-label           # Label field input
wizard-rule-field-domain          # Domain field input
```

#### `EditSummaryView.tsx`
```
wizard-rule-field-label           # Label field (same as step 1)
wizard-rule-field-domain          # Domain field (same as step 1)
```

#### `ConfigModeSelector.tsx`
```
wizard-rule-segmented-config      # Segmented control container
config-mode-{mode}                # Individual mode buttons (duplicate/hostname/path/includes)
```

### Sessions Components

#### `SessionCard.tsx`
```
session-card-{sessionId}          # Card container
session-card-{sessionId}-name     # Session name field
session-card-{sessionId}-btn-restore    # Restore button
session-card-{sessionId}-btn-dropdown   # Dropdown menu button
session-card-{sessionId}-preview-toggle # Preview toggle button
```

#### `SessionEditDialog.tsx`
```
dialog-session-edit               # Dialog container
dialog-session-edit-field-name    # Name input field
dialog-session-edit-btn-cancel    # Cancel button
dialog-session-edit-btn-save      # Save button
```

#### `TabTree.tsx`
```
tab-tree                          # Tab tree container
```

### Session Wizards

#### `SnapshotWizard.tsx`
```
wizard-snapshot                   # Dialog container
wizard-snapshot-field-name        # Name input field
wizard-snapshot-field-notes       # Notes textarea
wizard-snapshot-btn-cancel        # Cancel button
wizard-snapshot-btn-save          # Save button
```

#### `RestoreWizard.tsx`
```
wizard-restore                    # Dialog container
wizard-restore-step-0             # Step 0 (destination selection)
wizard-restore-radio-destination  # Destination radio group
wizard-restore-radio-current-window # "Current window" radio
wizard-restore-radio-new-window   # "New window" radio
wizard-restore-step-1             # Step 1 (conflict resolution)
wizard-restore-btn-restore        # Restore button
```

### Popup Components

#### `PopupProfilesList.tsx`
```
popup-profiles-list               # Profiles list container
popup-profile-item-{sessionId}    # Individual profile item
```

### Dialog Components

#### `ConfirmDialog.tsx`
```
confirm-dialog                    # Dialog container
confirm-dialog-btn-cancel         # Cancel button
confirm-dialog-btn-confirm        # Confirm button
```

### Other Components

#### `WizardStepper.tsx`
```
{custom-testid}                   # Accepts custom testId prop
```

#### `SplitButton.tsx`
```
{custom-testid}                   # Forwards data-testid to primary button
```

#### `ThemeToggle.tsx`
```
theme-toggle                      # Theme toggle button
```

#### `SettingsToggles.tsx`
```
settings-toggles                  # Group container (role="group")
settings-toggle-grouping          # Grouping toggle
settings-toggle-dedup             # Deduplication toggle
```

---

## 🎯 Usage Examples for Playwright

### Selecting by page
```typescript
// Click "Add rule" button on rules page
await page.click('[data-testid="page-rules-btn-add"]');

// Get sessions list
const sessionsList = await page.locator('[data-testid="page-sessions-list"]');
```

### Selecting dynamic elements
```typescript
// Click restore button for specific session
const sessionId = 'abc-123';
await page.click(`[data-testid="session-card-${sessionId}-btn-restore"]`);

// Access rule card menu
const ruleId = 'rule-456';
await page.click(`[data-testid="rule-card-${ruleId}-menu-edit"]`);
```

### Combining selectors
```typescript
// Find all session cards and iterate
const cards = await page.locator('[data-testid^="session-card-"]');
const count = await cards.count();

// Find button in specific card
const card = page.locator('[data-testid="session-card-uuid-123"]');
const restoreBtn = card.locator('[data-testid="session-card-uuid-123-btn-restore"]');
```

### Form inputs in wizards
```typescript
// Fill snapshot name
await page.fill('[data-testid="wizard-snapshot-field-name"]', 'My Snapshot');

// Fill notes
await page.fill('[data-testid="wizard-snapshot-field-notes"]', 'Some notes');

// Click save
await page.click('[data-testid="wizard-snapshot-btn-save"]');
```

### Dialog interactions
```typescript
// Confirm action
await page.click('[data-testid="confirm-dialog-btn-confirm"]');

// Select radio option in restore wizard
await page.click('[data-testid="wizard-restore-radio-new-window"]');
```

---

## 📊 Summary

- **Total data-testid entries**: 97+
- **Pages**: 7 (options, popup, rules, sessions, statistics, settings, import/export)
- **Unique element types**: Pages, cards, dialogs, forms, buttons, lists, toggles
- **Dynamic IDs**: Session/Rule IDs are embedded in testid (e.g., `session-card-{uuid}`)

