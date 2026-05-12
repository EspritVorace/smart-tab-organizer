import { Flex, TextField } from '@radix-ui/themes';
import { useState, useEffect, useMemo } from 'react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { DialogShell } from '@/components/UI/DialogShell';
import { EditModalFooter } from './EditModalFooter';
import { FormField } from '@/components/Form/FormFields';
import { TextFieldWithCategory } from '@/components/Form/FormFields/TextFieldWithCategory';
import { ChromeColorPicker } from '@/components/Core/TabTree/ChromeColorPicker';
import { createDomainFilterValidator } from '@/schemas/common';
import type { ChromeGroupColor } from '@/types/tabTree';
import type { DomainRule } from '@/schemas/domainRule';

const domainFilterValidator = createDomainFilterValidator();

function validateLabel(
  value: string,
  existingLabels: string[],
): FieldError | undefined {
  const trimmed = value.trim();
  if (!trimmed) return { type: 'required', message: getMessage('errorLabelRequired') };
  if (trimmed.length > 100) return { type: 'maxLength', message: getMessage('errorLabelTooLong') };
  if (existingLabels.includes(trimmed.toLowerCase())) {
    return { type: 'unique', message: getMessage('errorLabelUnique') };
  }
  return undefined;
}

function validateDomainFilter(value: string): FieldError | undefined {
  if (!value || value.trim() === '') {
    return { type: 'required', message: getMessage('errorDomainRequired') };
  }
  if (!domainFilterValidator.safeParse(value).success) {
    return { type: 'pattern', message: getMessage('errorInvalidDomain') };
  }
  return undefined;
}

export interface IdentityEditValues {
  label: string;
  categoryId: string | null;
  color: ChromeGroupColor;
  domainFilter: string;
}

interface IdentityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (values: IdentityEditValues) => void;
  initial: IdentityEditValues;
  /** Existing rules used to enforce label uniqueness. The edited rule (if any) is excluded by id. */
  existingRules: DomainRule[];
  editingRuleId?: string;
}

export function IdentityEditModal({
  isOpen,
  onClose,
  onApply,
  initial,
  existingRules,
  editingRuleId,
}: IdentityEditModalProps) {
  const [label, setLabel] = useState(initial.label);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [color, setColor] = useState<ChromeGroupColor>(initial.color);
  const [domainFilter, setDomainFilter] = useState(initial.domainFilter);

  useEffect(() => {
    if (isOpen) {
      setLabel(initial.label);
      setCategoryId(initial.categoryId);
      setColor(initial.color);
      setDomainFilter(initial.domainFilter);
    }
  }, [isOpen, initial]);

  const existingLabels = useMemo(
    () => existingRules
      .filter((r) => r.id !== editingRuleId)
      .map((r) => r.label.toLowerCase()),
    [existingRules, editingRuleId],
  );

  const labelError = useMemo(() => validateLabel(label, existingLabels), [label, existingLabels]);
  const domainError = useMemo(() => validateDomainFilter(domainFilter), [domainFilter]);
  const hasError = Boolean(labelError || domainError);

  const handleApply = () => {
    if (hasError) return;
    onApply({ label: label.trim(), categoryId, color, domainFilter: domainFilter.trim() });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={getMessage('editIdentityTitle')}
      description={getMessage('editIdentityTitle')}
      hideDescription
      maxWidth={680}
      showHeaderSeparator={false}
      data-testid="modal-edit-identity"
    >
      <Flex direction="column" gap="4" mt="4">
        <FormField label={getMessage('labelLabel')} required error={labelError}>
          {(fieldId) => (
            <div style={{ marginTop: '4px' }}>
              <TextFieldWithCategory
                id={fieldId}
                name="label"
                value={label}
                onChange={setLabel}
                data-testid="modal-edit-identity-field-label"
                placeholder={getMessage('labelPlaceholder')}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
              />
            </div>
          )}
        </FormField>

        <FormField label={getMessage('ruleColorLabel')}>
          {() => (
            <div style={{ marginTop: '4px' }}>
              <ChromeColorPicker value={color} onChange={setColor} />
            </div>
          )}
        </FormField>

        <FormField label={getMessage('domainFilter')} required error={domainError}>
          {(fieldId) => (
            <TextField.Root
              id={fieldId}
              name="domainFilter"
              data-testid="modal-edit-identity-field-domain"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              placeholder={getMessage('domainFilterPlaceholder')}
              style={{ marginTop: '4px' }}
            />
          )}
        </FormField>
      </Flex>

      <EditModalFooter
        onClose={onClose}
        onApply={handleApply}
        disabled={hasError}
        applyTestId="modal-edit-identity-btn-apply"
      />
    </DialogShell>
  );
}
