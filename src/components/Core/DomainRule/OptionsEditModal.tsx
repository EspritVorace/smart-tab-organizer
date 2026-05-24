import { Flex } from '@radix-ui/themes';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { EditModalShell } from './EditModalShell';
import { WizardStep3Options } from './WizardStep3Options';
import type { DeduplicationMatchModeValue } from '@/schemas/enums';
import type { DomainRule } from '@/schemas/domainRule';

export interface OptionsEditValues {
  deduplicationEnabled: boolean;
  deduplicationMatchMode: DeduplicationMatchModeValue;
  ignoredQueryParams: string[];
}

interface OptionsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (values: OptionsEditValues) => void;
  /**
   * Full rule snapshot used to seed the local form. WizardStep3Options is typed
   * against the complete DomainRule shape; we initialise the local form with the
   * full rule so we can reuse it unchanged, then only emit the three options fields
   * on apply.
   */
  initial: DomainRule;
}

const IGNORED_PARAM_PATTERN = /^[A-Za-z0-9_\-.*]+$/;

export function OptionsEditModal({ isOpen, onClose, onApply, initial }: OptionsEditModalProps) {
  const { control, reset, getValues, formState: { errors } } = useForm<DomainRule>({
    defaultValues: initial,
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) reset(initial);
  }, [isOpen, initial, reset]);

  const deduplicationEnabled = useWatch({ control, name: 'deduplicationEnabled' });
  const deduplicationMatchMode = useWatch({ control, name: 'deduplicationMatchMode' });
  const ignoredQueryParams = useWatch({ control, name: 'ignoredQueryParams' });

  const ignoredParamsInvalid =
    deduplicationEnabled
    && deduplicationMatchMode === 'exact_ignore_params'
    && (!Array.isArray(ignoredQueryParams)
      || ignoredQueryParams.length === 0
      || ignoredQueryParams.some((tag) => !IGNORED_PARAM_PATTERN.test(tag)));

  const handleApply = () => {
    if (ignoredParamsInvalid) return;
    const values = getValues();
    onApply({
      deduplicationEnabled: values.deduplicationEnabled,
      deduplicationMatchMode: values.deduplicationMatchMode,
      ignoredQueryParams: values.ignoredQueryParams ?? [],
    });
    onClose();
  };

  return (
    <EditModalShell
      isOpen={isOpen}
      onClose={onClose}
      onApply={handleApply}
      disabled={ignoredParamsInvalid}
      title={getMessage('editOptionsTitle')}
      maxWidth={680}
      applyTestId="modal-edit-options-btn-apply"
      data-testid="modal-edit-options"
    >
      <Flex direction="column" gap="4" mt="4">
        <WizardStep3Options
          control={control}
          deduplicationEnabled={deduplicationEnabled}
          errors={errors}
          autoFocusFirstField
        />
      </Flex>
    </EditModalShell>
  );
}
