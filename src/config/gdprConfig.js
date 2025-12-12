/**
 * Configuration GDPR pour l'application
 */

export const GDPR_CONFIG = {
  // Durées de rétention des données
  DATA_RETENTION: {
    ONE_YEAR: "1year",
    TWO_YEARS: "2years", 
    FOREVER: "forever"
  },

  // Types de données personnelles
  PERSONAL_DATA_TYPES: {
    PROFILE: "profile",
    RIDES: "rides",
    BOOKINGS: "bookings",
    NOTIFICATIONS: "notifications",
    PAYMENTS: "payments",
    COMMUNICATIONS: "communications"
  },

  // Droits GDPR
  GDPR_RIGHTS: {
    ACCESS: "access",
    RECTIFICATION: "rectification", 
    ERASURE: "erasure",
    PORTABILITY: "portability",
    RESTRICTION: "restriction",
    OBJECTION: "objection"
  },

  // Paramètres de confidentialité par défaut
  DEFAULT_PRIVACY_SETTINGS: {
    sharePhone: true,
    shareEmail: true,
    allowNotifications: true,
    allowMarketing: false,
    dataRetention: "1year",
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  },

  // Messages d'information GDPR
  GDPR_MESSAGES: {
    DATA_EXPORT: "Du har rätt att exportera alla dina data enligt GDPR.",
    DATA_DELETION: "Du har rätt att radera alla dina data permanent.",
    DATA_ANONYMIZATION: "Du kan anonymisera dina data istället för att radera dem.",
    CONSENT_WITHDRAWAL: "Du kan när som helst återkalla ditt samtycke.",
    DATA_PROCESSING: "Vi behandlar endast dina data för de ändamål du har samtyckt till."
  },

  // Politique de rétention des données
  RETENTION_POLICY: {
    PROFILE_DATA: {
      duration: "forever",
      description: "Profilinformation behålls tills kontot raderas"
    },
    RIDE_DATA: {
      duration: "2years", 
      description: "Resedata behålls i 2 år för bokföring"
    },
    BOOKING_DATA: {
      duration: "1year",
      description: "Bokningsdata behålls i 1 år"
    },
    NOTIFICATION_DATA: {
      duration: "6months",
      description: "Notifikationsdata behålls i 6 månader"
    },
    PAYMENT_DATA: {
      duration: "7years",
      description: "Betalningsdata behålls i 7 år för skatteändamål"
    }
  },

  // Types de consentement
  CONSENT_TYPES: {
    NECESSARY: "necessary",
    FUNCTIONAL: "functional", 
    ANALYTICS: "analytics",
    MARKETING: "marketing"
  },

  // Configuration des cookies
  COOKIE_CONFIG: {
    NECESSARY: {
      name: "necessary",
      description: "Nödvändiga cookies för att webbplatsen ska fungera",
      required: true
    },
    FUNCTIONAL: {
      name: "functional", 
      description: "Funktionella cookies för förbättrad användarupplevelse",
      required: false
    },
    ANALYTICS: {
      name: "analytics",
      description: "Analytics cookies för att förstå användning",
      required: false
    },
    MARKETING: {
      name: "marketing",
      description: "Marknadsföringscookies för personanpassade erbjudanden", 
      required: false
    }
  }
};

/**
 * Vérifier si une action respecte le GDPR
 */
export const isGDPRCompliant = (action, userSettings) => {
  switch (action) {
    case "data_processing":
      return userSettings?.allowDataProcessing === true;
    case "marketing":
      return userSettings?.allowMarketing === true;
    case "analytics":
      return userSettings?.allowAnalytics === true;
    case "third_party":
      return userSettings?.allowThirdParty === true;
    default:
      return false;
  }
};

/**
 * Obtenir la durée de rétention pour un type de données
 */
export const getRetentionDuration = (dataType) => {
  return GDPR_CONFIG.RETENTION_POLICY[dataType]?.duration || "1year";
};

/**
 * Vérifier si des données doivent être supprimées selon la politique de rétention
 */
export const shouldDeleteData = (dataType, createdAt) => {
  const retentionDuration = getRetentionDuration(dataType);
  const now = Date.now();
  const dataAge = now - createdAt;

  switch (retentionDuration) {
    case "6months":
      return dataAge > (6 * 30 * 24 * 60 * 60 * 1000);
    case "1year":
      return dataAge > (365 * 24 * 60 * 60 * 1000);
    case "2years":
      return dataAge > (2 * 365 * 24 * 60 * 60 * 1000);
    case "7years":
      return dataAge > (7 * 365 * 24 * 60 * 60 * 1000);
    case "forever":
      return false;
    default:
      return false;
  }
};

/**
 * Formater les données pour l'export GDPR
 */
export const formatDataForExport = (data, dataType) => {
  return {
    ...data,
    exportedAt: new Date().toISOString(),
    dataType,
    gdprCompliant: true,
    version: "1.0"
  };
};

export default GDPR_CONFIG; 