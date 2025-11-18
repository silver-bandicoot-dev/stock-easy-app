/**
 * Erreurs personnalisées pour le système ML
 * 
 * Permet une gestion d'erreurs plus précise et des messages plus clairs
 * 
 * @module utils/ml/mlErrors
 */

/**
 * Erreur de base pour le système ML
 */
export class MLError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MLError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Erreur de validation des données
 */
export class DataValidationError extends MLError {
  constructor(message, validationResult) {
    super(message, 'DATA_VALIDATION_ERROR', {
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      stats: validationResult.stats
    });
    this.name = 'DataValidationError';
    this.validationResult = validationResult;
  }

  /**
   * Récupère seulement les erreurs critiques
   */
  getCriticalErrors() {
    return this.validationResult.errors.filter(e => e.severity === 'critical');
  }

  /**
   * Récupère seulement les avertissements de haute priorité
   */
  getHighPriorityWarnings() {
    return this.validationResult.warnings.filter(w => w.severity === 'high');
  }

  /**
   * Formate un message lisible pour l'utilisateur
   */
  getUserFriendlyMessage() {
    const critical = this.getCriticalErrors();
    
    if (critical.length === 0) {
      return 'Erreur de validation des données';
    }

    if (critical.length === 1) {
      return critical[0].message;
    }

    return `${critical.length} problèmes détectés:\n` +
      critical.map(e => `• ${e.message}`).join('\n');
  }
}

/**
 * Erreur d'entraînement du modèle
 */
export class ModelTrainingError extends MLError {
  constructor(message, modelName, trainingDetails = {}) {
    super(message, 'MODEL_TRAINING_ERROR', {
      modelName,
      ...trainingDetails
    });
    this.name = 'ModelTrainingError';
    this.modelName = modelName;
  }
}

/**
 * Erreur de prédiction
 */
export class PredictionError extends MLError {
  constructor(message, modelName, inputData = {}) {
    super(message, 'PREDICTION_ERROR', {
      modelName,
      inputData
    });
    this.name = 'PredictionError';
    this.modelName = modelName;
  }
}

/**
 * Erreur de données insuffisantes
 */
export class InsufficientDataError extends DataValidationError {
  constructor(required, actual, dataType = 'records') {
    const message = `Données insuffisantes: ${actual} ${dataType} trouvé(s), ${required} requis`;
    super(message, {
      errors: [{
        code: 'INSUFFICIENT_DATA',
        message,
        severity: 'critical',
        required,
        actual
      }],
      warnings: [],
      stats: { count: actual }
    });
    this.name = 'InsufficientDataError';
    this.required = required;
    this.actual = actual;
  }
}

/**
 * Erreur de cache
 */
export class CacheError extends MLError {
  constructor(message, operation, cacheKey) {
    super(message, 'CACHE_ERROR', { operation, cacheKey });
    this.name = 'CacheError';
    this.operation = operation;
    this.cacheKey = cacheKey;
  }
}

/**
 * Génère des suggestions basées sur les erreurs de validation
 */
function generateSuggestions(validationResult) {
  const suggestions = [];

  validationResult.errors.forEach(error => {
    switch (error.code) {
      case 'INSUFFICIENT_DATA':
        suggestions.push('Collectez plus de données historiques pour améliorer la précision du modèle');
        break;
      case 'NEGATIVE_VALUES':
        suggestions.push('Vérifiez vos données de vente, les quantités négatives ne sont pas valides');
        break;
      case 'MISSING_VALUES':
        suggestions.push('Complétez les données manquantes ou supprimez les enregistrements incomplets');
        break;
      case 'TOO_MANY_MISSING_VALUES':
        suggestions.push('Plus de 10% de valeurs manquantes, nettoyez vos données avant l\'entraînement');
        break;
    }
  });

  validationResult.warnings.forEach(warning => {
    switch (warning.code) {
      case 'OUTLIERS_DETECTED':
        suggestions.push('Vérifiez les valeurs aberrantes, elles pourraient biaiser le modèle');
        break;
      case 'LOW_VARIANCE':
        suggestions.push('Vos données sont très uniformes, le modèle pourrait avoir du mal à détecter des patterns');
        break;
      case 'DATE_GAPS':
        suggestions.push('Il y a des trous dans votre historique, envisagez d\'interpoler les données manquantes');
        break;
    }
  });

  return suggestions.length > 0 ? suggestions : ['Vérifiez la qualité de vos données avant de réessayer'];
}

/**
 * Gestionnaire global d'erreurs ML
 */
export class MLErrorHandler {
  static handlers = new Map();

  /**
   * Enregistre un handler pour un type d'erreur
   */
  static registerHandler(errorType, handler) {
    this.handlers.set(errorType, handler);
  }

  /**
   * Gère une erreur ML
   */
  static handle(error) {
    // Log l'erreur
    console.error('ML Error:', error);

    // Trouve le handler approprié
    const handler = this.handlers.get(error.name) || this.handlers.get('default');

    if (handler) {
      return handler(error);
    }

    // Fallback: retourne l'erreur telle quelle
    return {
      success: false,
      error: error.message,
      details: error.details || {}
    };
  }

  /**
   * Wrap une fonction async avec gestion d'erreurs
   */
  static async wrap(fn, errorContext = {}) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof MLError) {
        throw error;
      }

      // Convertit les erreurs standard en MLError
      throw new MLError(
        error.message,
        'UNKNOWN_ERROR',
        { ...errorContext, originalError: error.message }
      );
    }
  }

  /**
   * Retry avec exponential backoff
   */
  static async retry(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      onRetry = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Ne pas retry sur erreurs de validation
        if (error instanceof DataValidationError) {
          throw error;
        }

        // Dernier essai
        if (attempt === maxRetries - 1) {
          break;
        }

        // Calcul du délai (exponential backoff)
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );

        if (onRetry) {
          onRetry(attempt + 1, maxRetries, error);
        }

        console.warn(`Retry ${attempt + 1}/${maxRetries} après ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Handlers par défaut
 */
MLErrorHandler.registerHandler('DataValidationError', (error) => {
  return {
    success: false,
    error: error.getUserFriendlyMessage(),
    validationResult: error.validationResult,
    suggestions: generateSuggestions(error.validationResult)
  };
});

MLErrorHandler.registerHandler('InsufficientDataError', (error) => {
  return {
    success: false,
    error: error.message,
    suggestion: `Collectez au moins ${error.required - error.actual} enregistrements supplémentaires`
  };
});

MLErrorHandler.registerHandler('default', (error) => {
  return {
    success: false,
    error: error.message || 'Une erreur inattendue est survenue',
    details: error.details || {}
  };
});

