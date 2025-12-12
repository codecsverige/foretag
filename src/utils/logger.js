/* ────────────────────────────────────────────────
   src/utils/logger.js
   Système de logging sécurisé pour la production
──────────────────────────────────────────────── */

/**
 * Logger sécurisé qui désactive automatiquement les logs en production
 * tout en gardant les fonctionnalités de debug en développement
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isTest = process.env.NODE_ENV === 'test';
  }

  /**
   * Log d'information - uniquement en développement
   */
  log(...args) {
    if (this.isDevelopment) {
      console.log('[INFO]', ...args);
    }
  }

  /**
   * Log d'avertissement - uniquement en développement et test
   */
  warn(...args) {
    if (this.isDevelopment || this.isTest) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Log d'erreur - toujours affiché mais avec données filtrées en production
   */
  error(...args) {
    if (this.isDevelopment || this.isTest) {
      console.error('[ERROR]', ...args);
    } else {
      // En production, log seulement les erreurs critiques sans données sensibles
      console.error('[ERROR] Une erreur s\'est produite');
    }
  }

  /**
   * Log de debug - uniquement en développement
   */
  debug(...args) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Log des performances - uniquement en développement
   */
  performance(label, ...args) {
    if (this.isDevelopment) {
      console.log(`[PERF] ${label}:`, ...args);
    }
  }

  /**
   * Log pour les API calls - filtre les données sensibles
   */
  api(action, data = {}) {
    if (this.isDevelopment) {
      const filteredData = this.filterSensitiveData(data);
      console.log(`[API] ${action}:`, filteredData);
    }
  }

  /**
   * Filtre les données sensibles pour éviter les fuites
   */
  filterSensitiveData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitive = ['password', 'token', 'email', 'phone', 'key', 'secret'];
    const filtered = { ...data };
    
    for (const key in filtered) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        filtered[key] = '[FILTERED]';
      }
    }
    
    return filtered;
  }
}

// Instance singleton
const logger = new Logger();

export default logger;
