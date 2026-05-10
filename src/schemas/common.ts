import { z } from 'zod';
import { getMessage } from '@/utils/i18n';

// Helper to validate UUID or string.
export const idSchema = z.string().min(1);

// Custom error map that routes Zod messages through the i18n layer.
const customErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case 'too_small':
      if (issue.origin === 'string') {
        return { message: getMessage('errorZodRequired') };
      }
      break;
    case 'too_big':
      if (issue.origin === 'string') {
        return { message: getMessage('errorZodMaxLength') };
      }
      break;
    case 'custom':
      return { message: issue.message || getMessage('errorZodInvalid') };
    case 'invalid_value':
      return { message: getMessage('errorZodInvalidValue') };
  }
  return undefined;
};

// Apply the custom error map.
z.config({ customError: customErrorMap });

// Helper to validate regular expressions.
export const createRegexValidator = (allowEmpty = false) => {
  return z.string().refine((val) => {
    if (allowEmpty && val === '') return true;
    try {
      new RegExp(val);
      // The regex must contain at least one capture group.
      return val.includes('(') && val.includes(')');
    } catch {
      return false;
    }
  }, { error: () => getMessage('errorInvalidRegex') });
};

// Helper to validate domain filters.
export const createDomainFilterValidator = () => {
  return z.string().min(1).refine((val) => {
    if (val === 'localhost') return true;

    // Plain domain names: at least two dot-separated parts, no trailing dot.
    // Wildcards (*.domain) are no longer accepted: subdomains match implicitly.
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;
    if (val.endsWith('.')) return false;
    if (domainRegex.test(val)) return true;

    // Regex filters must contain at least one regex special character.
    const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(val);
    if (hasRegexChars) {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, { error: () => getMessage('errorInvalidDomain') });
};