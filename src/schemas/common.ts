import { z } from 'zod';
import { getMessage } from '../utils/i18n';

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
      // Vérifier que la regex contient au moins un groupe de capture
      return val.includes('(') && val.includes(')');
    } catch {
      return false;
    }
  }, () => ({
    message: getMessage('errorInvalidRegex')
  }));
};

// Helper pour valider les filtres de domaine
export const createDomainFilterValidator = () => {
  return z.string().min(1).refine((val) => {
    // D'abord vérifier si c'est un nom de domaine valide
    if (val === 'localhost') return true;
    
    // Vérifier les patterns de domaine avec wildcards (ex: *.example.com)
    const wildcardDomainRegex = /^\*\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (wildcardDomainRegex.test(val)) return true;
    
    // Vérifier les noms de domaine normaux (au moins 2 parties séparées par un point, pas de point final)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;
    // Vérifier qu'il ne se termine pas par un point
    if (val.endsWith('.')) return false;
    if (domainRegex.test(val)) return true;
    
    // Pour les regex, vérifier qu'elles contiennent des caractères spéciaux regex
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
  }, () => ({
    message: getMessage('errorInvalidDomain')
  }));
};