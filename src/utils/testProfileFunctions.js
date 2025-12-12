/**
 * Tests pour les fonctions de la page de profil
 */

// Test de validation des paramètres de confidentialité
export const testPrivacySettings = (settings) => {
  const errors = [];
  
  if (typeof settings.sharePhone !== "boolean") {
    errors.push("sharePhone must be a boolean");
  }
  
  if (typeof settings.shareEmail !== "boolean") {
    errors.push("shareEmail must be a boolean");
  }
  
  if (typeof settings.allowNotifications !== "boolean") {
    errors.push("allowNotifications must be a boolean");
  }
  
  if (typeof settings.allowMarketing !== "boolean") {
    errors.push("allowMarketing must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test de validation des messages
export const testMessageFormat = (message) => {
  const requiredFields = ["text", "type"];
  const validTypes = ["success", "error", "warning", "info"];
  
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!message.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (message.text && typeof message.text !== "string") {
    errors.push("text must be a string");
  }
  
  if (message.type && !validTypes.includes(message.type)) {
    errors.push(`Invalid message type: ${message.type}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test de validation des données utilisateur
export const testUserData = (userData) => {
  const errors = [];
  
  if (!userData) {
    errors.push("User data is required");
    return { isValid: false, errors };
  }
  
  if (userData.sharePhone !== undefined && typeof userData.sharePhone !== "boolean") {
    errors.push("sharePhone must be a boolean");
  }
  
  if (userData.shareEmail !== undefined && typeof userData.shareEmail !== "boolean") {
    errors.push("shareEmail must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test de simulation des fonctions
export const simulateSavePrivacySettings = async (settings) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const validation = testPrivacySettings(settings);
      if (validation.isValid) {
        resolve({ success: true, message: "Settings saved successfully" });
      } else {
        resolve({ success: false, message: "Invalid settings", errors: validation.errors });
      }
    }, 1000);
  });
};

export const simulateExportData = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (userId) {
        resolve({ 
          success: true, 
          message: "Data exported successfully",
          data: {
            user: { uid: userId, email: "test@example.com" },
            rides: [],
            bookings: [],
            exports: { timestamp: new Date().toISOString() }
          }
        });
      } else {
        resolve({ success: false, message: "User ID required" });
      }
    }, 2000);
  });
};

export const simulateDeleteAccount = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (userId) {
        resolve({ success: true, message: "Account deleted successfully" });
      } else {
        resolve({ success: false, message: "User ID required" });
      }
    }, 3000);
  });
};

// Test de validation des onglets
export const testTabs = (tabs) => {
  const errors = [];
  
  if (!Array.isArray(tabs)) {
    errors.push("Tabs must be an array");
    return { isValid: false, errors };
  }
  
  tabs.forEach((tab, index) => {
    if (!tab.id) {
      errors.push(`Tab ${index} missing id`);
    }
    if (!tab.label) {
      errors.push(`Tab ${index} missing label`);
    }
    if (!tab.icon) {
      errors.push(`Tab ${index} missing icon`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  testPrivacySettings,
  testMessageFormat,
  testUserData,
  simulateSavePrivacySettings,
  simulateExportData,
  simulateDeleteAccount,
  testTabs
}; 