import { Dialog, Button, Flex, TextField, Select, Text, Box } from '@radix-ui/themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { LogicalGroupsTheme } from '../../Form/themes';
import { generateUUID, getRadixColor } from '../../../utils/utils';
import { createLogicalGroupSchemaWithUniqueness, type LogicalGroup } from '../../../schemas/logicalGroup';
import { colorOptions } from '../../../schemas/enums';
import { getMessage } from '../../../utils/i18n';
import type { SyncSettings } from '../../../types/syncSettings';
import { FormField } from '../../Form/FormFields';

interface LogicalGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logicalGroup: LogicalGroup) => void;
  logicalGroup?: LogicalGroup;
  syncSettings: SyncSettings;
}

export function LogicalGroupDialog({
  isOpen,
  onClose,
  onSubmit,
  logicalGroup,
  syncSettings
}: LogicalGroupDialogProps) {
  const isEditing = !!logicalGroup;
  
  const defaultValues: Partial<LogicalGroup> = logicalGroup ? {
    id: logicalGroup.id,
    label: logicalGroup.label,
    color: logicalGroup.color
  } : {
    id: generateUUID(),
    label: '',
    color: 'blue'
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<LogicalGroup>({
    resolver: zodResolver(createLogicalGroupSchemaWithUniqueness(syncSettings.logicalGroups, logicalGroup?.id)),
    defaultValues,
    mode: 'onChange'
  });

  const selectedColor = watch('color');

  const handleFormSubmit = (data: LogicalGroup) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const title = isEditing ? getMessage('editGroup') : getMessage('createGroup');

  return (
    <LogicalGroupsTheme>
      <Dialog.Root open={isOpen} onOpenChange={handleClose}>
        <Dialog.Content>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            {isEditing 
              ? getMessage('editGroupDescription') 
              : getMessage('createGroupDescription')
            }
          </Dialog.Description>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Flex direction="column" gap="4" mt="4">
              
              {/* Label */}
              <FormField 
                label={getMessage('labelLabel')} 
                required={true} 
                error={errors.label}
              >
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      placeholder={getMessage('labelPlaceholder')}
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
              </FormField>

              {/* Color */}
              <Flex direction="column">
                <Text as="label" size="2" weight="bold">
                  {getMessage('color')} <Text color="red">*</Text>
                </Text>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger 
                        variant="soft" 
                        style={{ marginTop: '4px', maxWidth: '200px' }}
                      >
                        <Flex align="center" gap="2">
                          <Box
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              backgroundColor: `var(--${getRadixColor(selectedColor)}-9)`,
                              border: `1px solid var(--${getRadixColor(selectedColor)}-8)`
                            }}
                          />
                          <Text>{getMessage(`color_${selectedColor}`)}</Text>
                        </Flex>
                      </Select.Trigger>
                      <Select.Content position="popper" side="bottom">
                        {colorOptions.map((colorOption) => (
                          <Select.Item key={colorOption.value} value={colorOption.value}>
                            <Flex align="center" gap="2">
                              <Box
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '3px',
                                  backgroundColor: `var(--${getRadixColor(colorOption.value)}-9)`,
                                  border: `1px solid var(--${getRadixColor(colorOption.value)}-8)`
                                }}
                              />
                              <Text>{getMessage(colorOption.keyLabel)}</Text>
                            </Flex>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                {errors.color && (
                  <Text size="1" color="red" style={{ marginTop: '4px' }}>
                    {errors.color.message}
                  </Text>
                )}
              </Flex>

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
    </LogicalGroupsTheme>
  );
}