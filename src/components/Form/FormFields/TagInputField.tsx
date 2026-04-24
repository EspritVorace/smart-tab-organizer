import { Badge, Flex, IconButton, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { getMessage } from '@/utils/i18n.js';
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
  const [isFocused, setIsFocused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inputId = useId();

  return (
    <Flex direction="column" gap="1">
      <FieldLabel required={required}>{label}</FieldLabel>

      {/* Visually hidden live region for screen reader announcements */}
      <span
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
        }}
      >
        {announcement}
      </span>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const tags: string[] = Array.isArray(field.value) ? field.value : [];

          const commitDraft = () => {
            const raw = draft.trim();
            if (!raw) return;
            if (validateTag && !validateTag.test(raw)) {
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
            setAnnouncement(getMessage('tagInputAdded', raw));
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
              const removed = tags[tags.length - 1];
              field.onChange(tags.slice(0, -1));
              setAnnouncement(getMessage('tagInputRemoved', removed));
            }
          };

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
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
                setAnnouncement(
                  additions.length === 1
                    ? getMessage('tagInputAdded', additions[0])
                    : getMessage('tagInputMultipleAdded', String(additions.length)),
                );
              }
              setDraft('');
              return;
            }
            setDraft(value);
          };

          const removeTag = (index: number) => {
            const removed = tags[index];
            field.onChange(tags.filter((_, i) => i !== index));
            setAnnouncement(getMessage('tagInputRemoved', removed));
            inputRef.current?.focus();
          };

          return (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                minHeight: '32px',
                borderRadius: 'var(--radius-2)',
                boxShadow: isFocused
                  ? 'inset 0 0 0 1px var(--accent-8), 0 0 0 1px var(--accent-8)'
                  : 'inset 0 0 0 1px var(--gray-a7)',
                backgroundColor: 'var(--color-surface)',
                cursor: 'text',
              }}
            >
              {tags.map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  color="gray"
                  variant="soft"
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
                      onClick={(e) => { e.stopPropagation(); removeTag(index); }}
                    >
                      <X size={12} aria-hidden="true" />
                    </IconButton>
                  </Flex>
                </Badge>
              ))}
              <input
                id={inputId}
                ref={inputRef}
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={() => { commitDraft(); setIsFocused(false); }}
                onFocus={() => setIsFocused(true)}
                placeholder={tags.length === 0 ? placeholder : undefined}
                aria-label={label}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  flex: '1 1 80px',
                  minWidth: '80px',
                  fontSize: 'var(--font-size-2)',
                  lineHeight: 'var(--line-height-2)',
                  color: 'var(--gray-12)',
                  padding: '2px 0',
                }}
              />
            </div>
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
