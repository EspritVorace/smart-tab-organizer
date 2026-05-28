import { logger } from './logger.js';

export interface ThirdPartyPackage {
  name: string;
  version: string;
  license: string;
  publisher: string;
  repository: string;
  scope: 'prod' | 'dev';
}

let cache: ThirdPartyPackage[] | null = null;

export async function loadThirdPartyLicenses(): Promise<ThirdPartyPackage[]> {
  if (cache) return cache;
  try {
    const response = await fetch('/data/third-party-licenses.json');
    if (!response.ok) {
      throw new Error(`Failed to load third-party licenses: ${response.status}`);
    }
    cache = (await response.json()) as ThirdPartyPackage[];
    return cache;
  } catch (error) {
    logger.error('Error loading third-party licenses:', error);
    return [];
  }
}
