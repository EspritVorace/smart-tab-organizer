import { Dialog, Button, Flex, TextField } from '@radix-ui/themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { RegexPresetsTheme } from '../../Form/themes';
import { generateUUID } from '../../../utils/utils';
import { createRegexPresetSchemaWithUniqueness, type RegexPreset } from '../../../schemas/regexPreset';
import { getMessage } from '../../../utils/i18n';
import type { SyncSettings } from '../../../types/syncSettings';
import { FormField } from '../../Form/FormFields';

interface RegexPresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (regexPreset: RegexPreset) => void;
  regexPreset?: RegexPreset;
  syncSettings: SyncSettings;
}

export function RegexPresetDialog({
  isOpen,
  onClose,
  onSubmit,
  regexPreset,
  syncSettings
}: RegexPresetDialogProps) {
  const isEditing = !!regexPreset;
  
  const defaultValues: Partial<RegexPreset> = regexPreset ? {
    id: regexPreset.id,
    name: regexPreset.name,
    titleParsingRegEx: regexPreset.titleParsingRegEx,
    urlParsingRegEx: regexPreset.urlParsingRegEx
  } : {
    id: generateUUID(),
    name: '',
    titleParsingRegEx: '',
    urlParsingRegEx: ''
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<RegexPreset>({
    resolver: zodResolver(createRegexPresetSchemaWithUniqueness(syncSettings.regexPresets, regexPreset?.id)),
    defaultValues,
    mode: 'onChange'
  });

  const handleFormSubmit = (data: RegexPreset) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const title = isEditing ? getMessage('editPreset') : getMessage('createPreset');

  return (
    <RegexPresetsTheme>
      <Dialog.Root open={isOpen} onOpenChange={handleClose}>
        <Dialog.Content>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            {isEditing 
              ? getMessage('editPresetDescription') 
              : getMessage('createPresetDescription')
            }
          </Dialog.Description>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Flex direction="column" gap="4" mt="4">
              
              {/* Name */}
              <FormField 
                label={getMessage('presetName')} 
                required={true} 
                error={errors.name}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      placeholder={getMessage('presetNamePlaceholder')}
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
              </FormField>

              {/* Title Regex Pattern */}
              <FormField 
                label={getMessage('titleRegex')} 
                required={true} 
                error={errors.titleParsingRegEx}
              >
                <Controller
                  name="titleParsingRegEx"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      placeholder="([A-Z]+-\\d+)"
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
              </FormField>

              {/* URL Regex Pattern (optional) */}
              <FormField 
                label={getMessage('urlRegex')} 
                required={false} 
                error={errors.urlParsingRegEx}
              >
                <Controller
                  name="urlParsingRegEx"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      placeholder="/browse/([A-Z]+-\\d+)"
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
              </FormField>

              <Flex gap="3" justify="end" mt="4">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {getMessage('cancel')}
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={!isValid}>
                  {isEditing ? getMessage('save') : getMessage('create')}
                </Button>
              </Flex>
            </Flex>
          </form>

          <Dialog.Close>
            <Button
              variant="ghost"
              size="1"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px'
              }}
            >
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </RegexPresetsTheme>
  );
}