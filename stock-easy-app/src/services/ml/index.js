/**
 * Point d'entrée pour les services ML
 */

export {
  collectSalesHistory,
  filterBySKU,
  getSalesStatistics
} from './dataCollector';

export { DemandForecastModel } from './demandForecastModel';

export {
  generateMLAlerts,
  calculateCriticalityScore,
  generateAutoRecommendations
} from './alertService';
