import { Badge, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { FieldLabel } from './FieldLabel';
import { FieldError } from './FieldError';

interface TagInputFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  helpText?: string;
  removeTagAriaLabel: string;
  /**
   * Regex that a raw tag must match. Tags that fail validation are silently
   * dropped (or surface a transient error). Use for syntactic constraints like
   * allowed characters.
   */
  validateTag?: RegExp;
  /** Maximum number of tags. Ignored if unspecified. */
  maxTags?: number;
  error?: { message?: string };
  required?: boolean;
}

export function TagInputField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  helpText,
  removeTagAriaLabel,
  validateTag,
  maxTags,
  error,
  required = false,
}: TagInputFieldProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  return (
    <Flex direction="column" gap="1">
      <FieldLabel required={required}>{label}</FieldLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const tags: string[] = Array.isArray(field.value) ? field.value : [];

          const commitDraft = () => {
            const raw = draft.trim();
            if (!raw) return;
            if (validateTag && !validateTag.test(raw)) {
              // Reset the draft so invalid text is not persisted silently.
              setDraft('');
              return;
            }
            if (tags.includes(raw)) {
              setDraft('');
              return;
            }
            if (typeof maxTags === 'number' && tags.length >= maxTags) {
              return;
            }
            field.onChange([...tags, raw]);
            setDraft('');
          };

          const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commitDraft();
              return;
            }
            if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
              event.preventDefault();
              field.onChange(tags.slice(0, -1));
            }
          };

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            // Accept paste or typing that contains a comma as a separator.
            if (value.includes(',')) {
              const parts = value.split(',').map(p => p.trim()).filter(Boolean);
              const additions: string[] = [];
              for (const part of parts) {
                if (validateTag && !validateTag.test(part)) continue;
                if (tags.includes(part) || additions.includes(part)) continue;
                if (typeof maxTags === 'number' && tags.length + additions.length >= maxTags) {
                  break;
                }
                additions.push(part);
              }
              if (additions.length > 0) {
                field.onChange([...tags, ...additions]);
              }
              setDraft('');
              return;
            }
            setDraft(value);
          };

          const removeTag = (index: number) => {
            const next = tags.filter((_, i) => i !== index);
            field.onChange(next);
            inputRef.current?.focus();
          };

          return (
            <Flex direction="column" gap="2">
              {tags.length > 0 && (
                <Flex gap="1" wrap="wrap" role="list">
                  {tags.map((tag, index) => (
                    <Badge
                      key={`${tag}-${index}`}
                      color="gray"
                      variant="soft"
                      role="listitem"
                      style={{ paddingRight: 2 }}
                    >
                      <Flex align="center" gap="1">
                        <Text size="1">{tag}</Text>
                        <IconButton
                          type="button"
                          size="1"
                          variant="ghost"
                          color="gray"
                          aria-label={`${removeTagAriaLabel}: ${tag}`}
                          onClick={() => removeTag(index)}
                        >
                          <X size={12} aria-hidden="true" />
                        </IconButton>
                      </Flex>
                    </Badge>
                  ))}
                </Flex>
              )}
              <TextField.Root
                ref={inputRef}
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={commitDraft}
                placeholder={placeholder}
                aria-label={label}
              />
            </Flex>
          );
        }}
      />
      {helpText && (
        <Text size="1" color="gray">{helpText}</Text>
      )}
      <FieldError error={error} />
    </Flex>
  );
}
