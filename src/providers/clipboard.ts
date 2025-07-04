
import { createClipboardProvider } from './createClipboardProvider';
import { type DomainRule } from '../schemas/domainRule';
import { type RegexPreset } from '../schemas/regexPreset';

// Création du Provider et du Hook pour les Domain Rules
const { 
  ClipboardProvider: DomainRuleClipboardProvider, 
  useClipboard: useDomainRuleClipboard 
} = createClipboardProvider<DomainRule>();

// Création du Provider et du Hook pour les Regex Presets
const { 
  ClipboardProvider: RegexPresetClipboardProvider, 
  useClipboard: useRegexPresetClipboard 
} = createClipboardProvider<RegexPreset>();

export {
  DomainRuleClipboardProvider,
  useDomainRuleClipboard,
  RegexPresetClipboardProvider,
  useRegexPresetClipboard,
};
