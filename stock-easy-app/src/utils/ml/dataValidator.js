/**
 * DataValidator - Validation robuste des données pour le Machine Learning
 * 
 * Vérifie la qualité des données avant l'entraînement des modèles
 * pour éviter les erreurs silencieuses et les prédictions incorrectes.
 * 
 * @module utils/ml/dataValidator
 */

export class DataValidator {
    /**
     * Valide un historique de ventes pour le ML
     * 
     * @param {Array} data - Historique des ventes [{date, quantity, ...}]
     * @param {Object} options - Options de validation
     * @param {number} options.minRecords - Minimum d'enregistrements requis (défaut: 50)
     * @param {number} options.maxZScore - Seuil Z-score pour outliers (défaut: 3)
     * @param {number} options.minCV - Coefficient de variation minimum (défaut: 0.05)
     * @param {number} options.maxGapDays - Écart maximum entre dates (défaut: 7)
     * @returns {Object} Résultat de validation {valid, errors, warnings, stats}
     */
    static validateSalesHistory(data, options = {}) {
      const config = {
        minRecords: options.minRecords || 50,
        maxZScore: options.maxZScore || 3,
        minCV: options.minCV || 0.05,
        maxGapDays: options.maxGapDays || 7,
        ...options
      };
  
      const errors = [];
      const warnings = [];
      let stats = null;
  
      // ========================================
      // VALIDATIONS CRITIQUES (bloquantes)
      // ========================================
  
      // 1. Vérification existence et type des données
      if (!data) {
        errors.push({
          code: 'NULL_DATA',
          message: 'Les données sont null ou undefined',
          severity: 'critical',
          field: 'data'
        });
        return { valid: false, errors, warnings, stats: null };
      }
  
      if (!Array.isArray(data)) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Type invalide: attendu Array, reçu ${typeof data}`,
          severity: 'critical',
          field: 'data'
        });
        return { valid: false, errors, warnings, stats: null };
      }
  
      // 2. Quantité minimale de données
      if (data.length < config.minRecords) {
        errors.push({
          code: 'INSUFFICIENT_DATA',
          message: `Au moins ${config.minRecords} enregistrements requis, trouvés: ${data.length}`,
          severity: 'critical',
          field: 'length',
          expected: config.minRecords,
          actual: data.length
        });
      }
  
      // 3. Validation de la structure des enregistrements
      const structureErrors = this.validateRecordStructure(data);
      if (structureErrors.length > 0) {
        errors.push(...structureErrors);
      }
  
      // Si erreurs critiques, on arrête ici
      if (errors.length > 0) {
        return { valid: false, errors, warnings, stats: null };
      }
  
      // ========================================
      // CALCUL DES STATISTIQUES
      // ========================================
  
      const quantities = data.map(d => d.quantity);
      stats = this.calculateStats(quantities);
  
      // ========================================
      // VALIDATIONS DE DONNÉES (potentiellement bloquantes)
      // ========================================
  
      // 4. Valeurs négatives
      const negativeValues = data.filter(d => d.quantity < 0);
      if (negativeValues.length > 0) {
        errors.push({
          code: 'NEGATIVE_VALUES',
          message: `${negativeValues.length} valeur(s) négative(s) détectée(s)`,
          severity: 'critical',
          field: 'quantity',
          count: negativeValues.length,
          samples: negativeValues.slice(0, 3).map(d => ({
            date: d.date,
            quantity: d.quantity
          }))
        });
      }
  
      // 5. Valeurs nulles ou manquantes
      const missingValues = data.filter(d => 
        d.quantity === null || 
        d.quantity === undefined || 
        !d.date
      );
      
      if (missingValues.length > 0) {
        const missingRate = (missingValues.length / data.length) * 100;
        
        if (missingRate > 10) {
          errors.push({
            code: 'TOO_MANY_MISSING_VALUES',
            message: `${missingRate.toFixed(1)}% de valeurs manquantes (max 10%)`,
            severity: 'high',
            field: 'quantity/date',
            count: missingValues.length,
            rate: missingRate
          });
        } else {
          warnings.push({
            code: 'MISSING_VALUES',
            message: `${missingValues.length} valeur(s) manquante(s) détectée(s)`,
            severity: 'medium',
            field: 'quantity/date',
            count: missingValues.length
          });
        }
      }
  
      // ========================================
      // AVERTISSEMENTS (non-bloquants)
      // ========================================
  
      // 6. Outliers (valeurs aberrantes)
      const outliers = data.filter(d => {
        const zScore = Math.abs((d.quantity - stats.mean) / stats.std);
        return zScore > config.maxZScore;
      });
      
      if (outliers.length > 0) {
        const outlierRate = (outliers.length / data.length) * 100;
        
        warnings.push({
          code: 'OUTLIERS_DETECTED',
          message: `${outliers.length} valeur(s) aberrante(s) (${outlierRate.toFixed(1)}%)`,
          severity: outlierRate > 5 ? 'high' : 'medium',
          field: 'quantity',
          count: outliers.length,
          rate: outlierRate,
          samples: outliers.slice(0, 3).map(d => ({
            date: d.date,
            quantity: d.quantity,
            zScore: ((d.quantity - stats.mean) / stats.std).toFixed(2)
          }))
        });
      }
  
      // 7. Données trop uniformes (variance trop faible)
      if (stats.cv < config.minCV) {
        warnings.push({
          code: 'LOW_VARIANCE',
          message: `Données trop uniformes (CV: ${(stats.cv * 100).toFixed(1)}%)`,
          severity: 'medium',
          field: 'quantity',
          cv: stats.cv,
          explanation: 'Le modèle pourrait avoir du mal à apprendre des patterns avec si peu de variation'
        });
      }
  
      // 8. Vérification de valeurs identiques suspectes
      const valueCounts = this.countUniqueValues(quantities);
      const mostCommon = Math.max(...Object.values(valueCounts));
      const mostCommonRate = (mostCommon / data.length) * 100;
      
      if (mostCommonRate > 50) {
        warnings.push({
          code: 'REPEATED_VALUES',
          message: `Une valeur se répète ${mostCommonRate.toFixed(1)}% du temps`,
          severity: 'medium',
          field: 'quantity',
          rate: mostCommonRate,
          explanation: 'Cela pourrait indiquer des données artificielles ou une erreur de saisie'
        });
      }
  
      // 9. Détection de trous dans les dates
      const dateGaps = this.detectDateGaps(data, config.maxGapDays);
      if (dateGaps.length > 0) {
        const totalGapDays = dateGaps.reduce((sum, gap) => sum + gap.days, 0);
        
        warnings.push({
          code: 'DATE_GAPS',
          message: `${dateGaps.length} trou(s) dans l'historique (${totalGapDays} jours manquants)`,
          severity: dateGaps.length > 5 ? 'high' : 'low',
          field: 'date',
          count: dateGaps.length,
          totalDays: totalGapDays,
          samples: dateGaps.slice(0, 3)
        });
      }
  
      // 10. Vérification de l'ordre chronologique
      const chronologyIssues = this.validateChronology(data);
      if (chronologyIssues.length > 0) {
        warnings.push({
          code: 'CHRONOLOGY_ISSUES',
          message: `${chronologyIssues.length} problème(s) d'ordre chronologique`,
          severity: 'high',
          field: 'date',
          count: chronologyIssues.length,
          samples: chronologyIssues.slice(0, 3)
        });
      }
  
      // 11. Détection de tendance forte (qui pourrait biaiser le modèle)
      const trend = this.detectTrend(data);
      if (Math.abs(trend.slope) > stats.mean * 0.05) {
        warnings.push({
          code: 'STRONG_TREND',
          message: `Tendance ${trend.direction} forte détectée`,
          severity: 'low',
          field: 'quantity',
          slope: trend.slope,
          direction: trend.direction,
          explanation: 'Le modèle devra tenir compte de cette tendance'
        });
      }
  
      // ========================================
      // RÉSULTAT FINAL
      // ========================================
  
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          count: data.length,
          mean: stats.mean,
          median: stats.median,
          std: stats.std,
          cv: stats.cv,
          min: stats.min,
          max: stats.max,
          q1: stats.q1,
          q3: stats.q3,
          iqr: stats.iqr,
          uniqueValues: Object.keys(valueCounts).length,
          dateRange: {
            start: data[0]?.date,
            end: data[data.length - 1]?.date,
            days: this.daysBetween(data[0]?.date, data[data.length - 1]?.date)
          }
        }
      };
    }
  
    /**
     * Valide la structure de chaque enregistrement
     */
    static validateRecordStructure(data) {
      const errors = [];
      const requiredFields = ['date', 'quantity'];
      
      for (let i = 0; i < Math.min(data.length, 10); i++) { // Vérifie les 10 premiers
        const record = data[i];
        
        if (!record || typeof record !== 'object') {
          errors.push({
            code: 'INVALID_RECORD_TYPE',
            message: `Enregistrement ${i} invalide: attendu Object, reçu ${typeof record}`,
            severity: 'critical',
            index: i
          });
          continue;
        }
  
        // Vérifie les champs requis
        for (const field of requiredFields) {
          if (!(field in record)) {
            errors.push({
              code: 'MISSING_FIELD',
              message: `Champ "${field}" manquant dans l'enregistrement ${i}`,
              severity: 'critical',
              index: i,
              field
            });
          }
        }
  
        // Vérifie le type de quantity
        if (record.quantity !== undefined && 
            record.quantity !== null && 
            typeof record.quantity !== 'number') {
          errors.push({
            code: 'INVALID_FIELD_TYPE',
            message: `"quantity" doit être un nombre (enregistrement ${i})`,
            severity: 'critical',
            index: i,
            field: 'quantity',
            actual: typeof record.quantity
          });
        }
  
        // Vérifie le format de date
        if (record.date && !this.isValidDate(record.date)) {
          errors.push({
            code: 'INVALID_DATE_FORMAT',
            message: `Format de date invalide (enregistrement ${i})`,
            severity: 'critical',
            index: i,
            field: 'date',
            value: record.date
          });
        }
      }
  
      return errors;
    }
  
    /**
     * Calcule les statistiques descriptives
     */
    static calculateStats(values) {
      const sorted = [...values].sort((a, b) => a - b);
      const n = values.length;
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
      const std = Math.sqrt(variance);
      
      return {
        mean,
        median: this.median(sorted),
        std,
        cv: std / mean, // Coefficient de variation
        min: sorted[0],
        max: sorted[n - 1],
        q1: this.percentile(sorted, 25),
        q3: this.percentile(sorted, 75),
        iqr: this.percentile(sorted, 75) - this.percentile(sorted, 25)
      };
    }
  
    /**
     * Calcule la médiane
     */
    static median(sortedValues) {
      const mid = Math.floor(sortedValues.length / 2);
      return sortedValues.length % 2 === 0
        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
        : sortedValues[mid];
    }
  
    /**
     * Calcule un percentile
     */
    static percentile(sortedValues, p) {
      const index = (p / 100) * (sortedValues.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      
      return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
  
    /**
     * Compte les valeurs uniques et leur fréquence
     */
    static countUniqueValues(values) {
      return values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    }
  
    /**
     * Détecte les trous dans les dates
     */
    static detectDateGaps(data, maxGapDays = 7) {
      const gaps = [];
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
  
      for (let i = 1; i < sortedData.length; i++) {
        const daysDiff = this.daysBetween(
          sortedData[i - 1].date,
          sortedData[i].date
        );
        
        if (daysDiff > maxGapDays) {
          gaps.push({
            from: sortedData[i - 1].date,
            to: sortedData[i].date,
            days: daysDiff
          });
        }
      }
  
      return gaps;
    }
  
    /**
     * Valide l'ordre chronologique
     */
    static validateChronology(data) {
      const issues = [];
      
      for (let i = 1; i < data.length; i++) {
        const prev = new Date(data[i - 1].date);
        const curr = new Date(data[i].date);
        
        if (curr < prev) {
          issues.push({
            index: i,
            date: data[i].date,
            previousDate: data[i - 1].date,
            message: 'Date antérieure à la précédente'
          });
        }
      }
  
      return issues;
    }
  
    /**
     * Détecte une tendance linéaire
     */
    static detectTrend(data) {
      const n = data.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = data.map(d => d.quantity);
      
      const meanX = x.reduce((a, b) => a + b, 0) / n;
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (x[i] - meanX) * (y[i] - meanY);
        denominator += Math.pow(x[i] - meanX, 2);
      }
      
      const slope = numerator / denominator;
      
      return {
        slope,
        direction: slope > 0 ? 'haussière' : 'baissière',
        strength: Math.abs(slope) / meanY
      };
    }
  
    /**
     * Calcule le nombre de jours entre deux dates
     */
    static daysBetween(date1, date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diff = Math.abs(d2 - d1);
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
  
    /**
     * Vérifie si une date est valide
     */
    static isValidDate(date) {
      if (!date) return false;
      const d = new Date(date);
      return d instanceof Date && !isNaN(d);
    }
  
    /**
     * Formate un rapport de validation lisible
     */
    static formatValidationReport(validation) {
      let report = '\n📊 RAPPORT DE VALIDATION DES DONNÉES\n';
      report += '='.repeat(50) + '\n\n';
  
      if (validation.valid) {
        report += '✅ Validation réussie !\n\n';
      } else {
        report += '❌ Validation échouée\n\n';
      }
  
      // Erreurs
      if (validation.errors.length > 0) {
        report += '🔴 ERREURS CRITIQUES:\n';
        validation.errors.forEach((error, i) => {
          report += `  ${i + 1}. [${error.code}] ${error.message}\n`;
          if (error.samples) {
            report += `     Exemples: ${JSON.stringify(error.samples, null, 2)}\n`;
          }
        });
        report += '\n';
      }
  
      // Avertissements
      if (validation.warnings.length > 0) {
        report += '⚠️  AVERTISSEMENTS:\n';
        validation.warnings.forEach((warning, i) => {
          report += `  ${i + 1}. [${warning.code}] ${warning.message}\n`;
          if (warning.explanation) {
            report += `     → ${warning.explanation}\n`;
          }
        });
        report += '\n';
      }
  
      // Statistiques
      if (validation.stats) {
        report += '📈 STATISTIQUES:\n';
        report += `  Nombre d'enregistrements: ${validation.stats.count}\n`;
        report += `  Moyenne: ${validation.stats.mean.toFixed(2)}\n`;
        report += `  Médiane: ${validation.stats.median.toFixed(2)}\n`;
        report += `  Écart-type: ${validation.stats.std.toFixed(2)}\n`;
        report += `  Min/Max: ${validation.stats.min} / ${validation.stats.max}\n`;
        report += `  Coefficient de variation: ${(validation.stats.cv * 100).toFixed(1)}%\n`;
        
        if (validation.stats.dateRange) {
          report += `  Période: ${validation.stats.dateRange.start} → ${validation.stats.dateRange.end}\n`;
          report += `  Durée: ${validation.stats.dateRange.days} jours\n`;
        }
      }
  
      report += '\n' + '='.repeat(50) + '\n';
      return report;
    }
  }


