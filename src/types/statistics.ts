// Interface pour les statistiques de l'extension
export interface Statistics {
  tabGroupsCreatedCount: number;
  tabsDeduplicatedCount: number;
}

// Valeurs par défaut pour les statistiques
export const defaultStatistics: Statistics = {
  tabGroupsCreatedCount: 0,
  tabsDeduplicatedCount: 0
};