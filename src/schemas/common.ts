import { z } from 'zod';
import { getMessage } from '../utils/i18n.js';

// Helper pour valider UUID ou string
export const idSchema = z.string().min(1);

// Custom error map pour utiliser les traductions
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: getMessage('errorZodRequired') };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: getMessage('errorZodMaxLength') };
      }
      break;
    case z.ZodIssueCode.custom:
      return { message: issue.message || getMessage('errorZodInvalid') };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: getMessage('errorZodInvalidValue') };
  }
  return { message: ctx.defaultError };
};

// Appliquer la error map personnalisée
z.setErrorMap(customErrorMap);

// Helper pour valider les expressions régulières
export const createRegexValidator = (allowEmpty = false) => {
  return z.string().refine((val) => {
    if (allowEmpty && val === '') return true;
    try {
      new RegExp(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: getMessage('errorInvalidRegex')
  });
};